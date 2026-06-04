import { getClient } from "./client";
import { findUserById } from "./users";
import { rowToPublicUser } from "./types";

export interface DbGroup {
  id: string;
  name: string;
  creator_id: string;
  created_at: number;
}

export async function createGroup(
  id: string,
  name: string,
  creatorId: string,
  memberIds: string[],
  wrappedKeys: { user_id: string; wrapped_key: string }[],
  wrappedBy: string
): Promise<DbGroup> {
  const created_at = Date.now();
  const client = getClient();
  const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

  await client.execute({
    sql: "INSERT INTO groups (id, name, creator_id, created_at) VALUES (?, ?, ?, ?)",
    args: [id, name.trim(), creatorId, created_at],
  });

  for (const userId of uniqueMembers) {
    const role = userId === creatorId ? "owner" : "member";
    await client.execute({
      sql: `INSERT INTO group_members (group_id, user_id, role, joined_at)
            VALUES (?, ?, ?, ?)`,
      args: [id, userId, role, created_at],
    });
  }

  for (const { user_id, wrapped_key } of wrappedKeys) {
    if (!uniqueMembers.includes(user_id)) continue;
    await client.execute({
      sql: `INSERT INTO group_keys (group_id, user_id, wrapped_key, wrapped_by)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(group_id, user_id) DO UPDATE SET
              wrapped_key = excluded.wrapped_key,
              wrapped_by = excluded.wrapped_by`,
      args: [id, user_id, wrapped_key, wrappedBy],
    });
  }

  return { id, name: name.trim(), creator_id: creatorId, created_at };
}

export async function isGroupMember(
  groupId: string,
  userId: string
): Promise<boolean> {
  const result = await getClient().execute({
    sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
    args: [groupId, userId],
  });
  return result.rows.length > 0;
}

export async function getUserGroups(userId: string) {
  const result = await getClient().execute({
    sql: `SELECT g.id, g.name, g.creator_id, g.created_at
          FROM groups g
          INNER JOIN group_members gm ON gm.group_id = g.id
          WHERE gm.user_id = ?
          ORDER BY g.created_at DESC`,
    args: [userId],
  });

  return Promise.all(
    result.rows.map(async (row) => {
      const groupId = String(row.id);
      const membersResult = await getClient().execute({
        sql: "SELECT user_id FROM group_members WHERE group_id = ?",
        args: [groupId],
      });
      const members = await Promise.all(
        membersResult.rows.map(async (m) => {
          const user = await findUserById(String(m.user_id));
          return user ? rowToPublicUser(user) : null;
        })
      );

      const lastMsg = await getClient().execute({
        sql: `SELECT id, sender_id, receiver_id, content, created_at, group_id
              FROM messages WHERE group_id = ? ORDER BY created_at DESC LIMIT 1`,
        args: [groupId],
      });

      const lastRow = lastMsg.rows[0];
      const lastMessage = lastRow
        ? {
            id: String(lastRow.id),
            sender_id: String(lastRow.sender_id),
            receiver_id: String(lastRow.receiver_id),
            content: String(lastRow.content),
            created_at: Number(lastRow.created_at),
            group_id: groupId,
          }
        : null;

      return {
        id: groupId,
        name: String(row.name),
        creator_id: String(row.creator_id),
        created_at: Number(row.created_at),
        members: members.filter((m): m is NonNullable<typeof m> => Boolean(m)),
        lastMessage,
        lastMessageAt: lastMessage?.created_at ?? 0,
      };
    })
  );
}

export async function getGroupWrappedKey(
  groupId: string,
  userId: string
): Promise<{ wrapped_key: string; wrapped_by: string } | null> {
  const result = await getClient().execute({
    sql: `SELECT wrapped_key, wrapped_by FROM group_keys
          WHERE group_id = ? AND user_id = ?`,
    args: [groupId, userId],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    wrapped_key: String(row.wrapped_key ?? ""),
    wrapped_by: String(row.wrapped_by ?? ""),
  };
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  wrappedKey: string,
  wrappedBy: string
): Promise<void> {
  await getClient().execute({
    sql: `INSERT INTO group_members (group_id, user_id, role, joined_at)
          VALUES (?, ?, 'member', ?)`,
    args: [groupId, userId, Date.now()],
  });
  await getClient().execute({
    sql: `INSERT INTO group_keys (group_id, user_id, wrapped_key, wrapped_by)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(group_id, user_id) DO UPDATE SET
            wrapped_key = excluded.wrapped_key,
            wrapped_by = excluded.wrapped_by`,
    args: [groupId, userId, wrappedKey, wrappedBy],
  });
}

export async function getGroupById(groupId: string): Promise<DbGroup | null> {
  const result = await getClient().execute({
    sql: "SELECT id, name, creator_id, created_at FROM groups WHERE id = ?",
    args: [groupId],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    creator_id: String(row.creator_id),
    created_at: Number(row.created_at),
  };
}
