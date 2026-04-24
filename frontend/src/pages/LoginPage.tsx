import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plane } from 'lucide-react';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { username, password });
      localStorage.setItem('token', data.access_token);
      navigate('/workstation');
    } catch {
      toast.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground dark:bg-gradient-to-br dark:from-[oklch(0.22_0.04_280)] dark:to-[oklch(0.16_0.02_260)] dark:text-[oklch(0.90_0.005_260)]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <Plane className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AeroEquip</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            航空设备<br />管理平台
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/70 dark:text-[oklch(0.70_0.01_260)] max-w-sm">
            面向航空制造的设备构型管理系统，覆盖重量平衡、电气负载、DO-160 鉴定、EWIS 布线等全生命周期管理。
          </p>
        </div>

        <p className="text-xs text-primary-foreground/40 dark:text-[oklch(0.55_0.01_260)]">
          AeroEquip v0.1.0
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <Card className="w-full max-w-[380px] border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="size-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">AeroEquip</span>
            </div>
            <CardTitle className="text-xl">登录</CardTitle>
            <CardDescription>输入您的账户信息以继续</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-xs">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="请输入用户名"
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                登录
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              默认账户: admin / admin123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
