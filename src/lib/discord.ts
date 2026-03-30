export async function getUserGuildRoles(userId: string): Promise<string[]> {
  const guildId = process.env.DISCORD_GUILD_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    { headers: { Authorization: `Bot ${botToken}` }, next: { revalidate: 0 } }
  );
  if (!res.ok) return [];
  const member = await res.json();
  return member.roles as string[];
}

export async function hasAdminRole(userId: string, adminRoleId: string): Promise<boolean> {
  const roles = await getUserGuildRoles(userId);
  return roles.includes(adminRoleId);
}
