import client from './client';

export interface UserInfo {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  specialty: string | null;
  ata_chapters: string[] | null;
  is_active: boolean;
}

export interface RoleOption {
  key: string;
  label: string;
}

export async function listUsers(): Promise<UserInfo[]> {
  const { data } = await client.get('/users');
  return data;
}

export async function createUser(body: {
  username: string;
  password: string;
  display_name?: string;
  role: string;
  specialty?: string;
  ata_chapters?: string[];
}): Promise<UserInfo> {
  const { data } = await client.post('/users', body);
  return data;
}

export async function updateUser(id: string, body: Partial<UserInfo>): Promise<UserInfo> {
  const { data } = await client.patch(`/users/${id}`, body);
  return data;
}

export async function listRoles(): Promise<RoleOption[]> {
  const { data } = await client.get('/users/roles');
  return data;
}
