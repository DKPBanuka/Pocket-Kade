
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { inviteUserSchema } from "@/lib/schemas";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createInvitationAction } from "@/app/actions";
import { useLanguage } from "@/contexts/language-context";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export function AddUserDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: "staff" },
  });

  const onSubmit = async (data: InviteUserFormData) => {
    if (!user?.activeTenantId || user.activeRole !== 'owner') {
      toast({ title: "Permission Denied", description: "Only the owner can invite new members.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await createInvitationAction(data.email, data.role as 'admin' | 'staff', user.activeTenantId);
    if (result.success && result.link) {
      setInvitationLink(result.link);
    } else {
      toast({ title: t('users.invite.fail_title'), description: result.error, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setTimeout(() => {
        setInvitationLink(null);
        form.reset();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetAndClose();
      else setIsOpen(true);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {invitationLink ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('users.invite.success_title')}</DialogTitle>
              <DialogDescription>{t('users.invite.success_desc')}</DialogDescription>
            </DialogHeader>
            <div className="relative my-4">
              <Input value={invitationLink} readOnly />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={resetAndClose}>{t('users.invite.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('users.invite.title')}</DialogTitle>
              <DialogDescription>{t('users.invite.desc')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.invite.email_label')}</FormLabel>
                      <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.invite.role_label')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="staff">{t('users.role.staff')}</SelectItem>
                          <SelectItem value="admin">{t('users.role.admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('users.invite.generate_btn')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
