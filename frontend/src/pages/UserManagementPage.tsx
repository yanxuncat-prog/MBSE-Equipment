import { useState, useEffect, useCallback } from 'react';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { listUsers, createUser, updateUser, listRoles } from '@/api/users';
import type { UserInfo, RoleOption } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const ROLE_COLORS: Record<string, string> = {
  admin: 'default',
  engineer: 'secondary',
  viewer: 'outline',
};

const SPECIALTY_OPTIONS = [
  '航电', '机电', '飞控', '通信导航', '电源', '环控', '结构', '动力',
];

export function UserManagementPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserInfo | null>(null);

  // Create form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editActive, setEditActive] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      toast.error('加载用户列表失败');
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const data = await listRoles();
      setRoles(data);
    } catch {
      // Fallback roles
      setRoles([
        { key: 'admin', label: '管理员' },
        { key: 'engineer', label: '工程师' },
        { key: 'viewer', label: '查看者' },
      ]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  const handleCreate = async () => {
    if (!newUsername || !newPassword || !newRole) {
      toast.error('请填写必填字段');
      return;
    }
    try {
      await createUser({
        username: newUsername,
        password: newPassword,
        display_name: newDisplayName || undefined,
        role: newRole,
        specialty: newSpecialty || undefined,
      });
      toast.success('用户创建成功');
      setCreateOpen(false);
      resetCreateForm();
      loadUsers();
    } catch {
      toast.error('创建失败');
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await updateUser(editUser.id, {
        display_name: editDisplayName || null,
        role: editRole,
        specialty: editSpecialty || null,
        is_active: editActive,
      });
      toast.success('用户更新成功');
      setEditUser(null);
      loadUsers();
    } catch {
      toast.error('更新失败');
    }
  };

  const resetCreateForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewDisplayName('');
    setNewRole('');
    setNewSpecialty('');
  };

  const openEdit = (user: UserInfo) => {
    setEditUser(user);
    setEditDisplayName(user.display_name || '');
    setEditRole(user.role);
    setEditSpecialty(user.specialty || '');
    setEditActive(user.is_active);
  };

  const getRoleLabel = (key: string) => {
    const role = roles.find(r => r.key === key);
    return role?.label || key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">用户管理</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          添加用户
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>显示名</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>专业方向</TableHead>
            <TableHead>ATA章节</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow
              key={user.id}
              className="cursor-pointer"
              onClick={() => openEdit(user)}
            >
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.display_name || '-'}</TableCell>
              <TableCell>
                <Badge variant={(ROLE_COLORS[user.role] as any) || 'secondary'}>
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>{user.specialty || '-'}</TableCell>
              <TableCell>
                {user.ata_chapters && user.ata_chapters.length > 0
                  ? user.ata_chapters.join(', ')
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'default' : 'outline'}>
                  {user.is_active ? '启用' : '停用'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                暂无用户数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>用户名 *</Label>
              <Input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-1.5">
              <Label>密码 *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <div className="space-y-1.5">
              <Label>显示名</Label>
              <Input
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                placeholder="请输入显示名"
              />
            </div>
            <div className="space-y-1.5">
              <Label>角色 *</Label>
              <Select value={newRole} onValueChange={(v) => v && setNewRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>专业方向</Label>
              <Select value={newSpecialty} onValueChange={(v) => v && setNewSpecialty(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择专业方向" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTY_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户 - {editUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>显示名</Label>
              <Input
                value={editDisplayName}
                onChange={e => setEditDisplayName(e.target.value)}
                placeholder="请输入显示名"
              />
            </div>
            <div className="space-y-1.5">
              <Label>角色</Label>
              <Select value={editRole} onValueChange={(v) => v && setEditRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>专业方向</Label>
              <Select value={editSpecialty} onValueChange={(v) => v && setEditSpecialty(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择专业方向" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTY_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={editActive}
                onCheckedChange={(checked) => setEditActive(checked === true)}
              />
              <Label>启用账户</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>取消</Button>
            <Button onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
