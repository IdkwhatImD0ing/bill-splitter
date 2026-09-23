'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full btn-brand" disabled={pending}>
      {pending ? 'Logging in...' : 'Enter'}
    </Button>
  )
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-background dark:via-brand-50/5 dark:to-background p-4">
      <div className="absolute inset-0 bg-receipt-pattern" />
      
      <Card className="w-full max-w-sm relative z-10 card-receipt">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-2 shadow-lg shadow-brand-500/25">
            <span className="text-2xl">🧾</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gradient-brand">
            Bill Splitter
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoFocus
                className="border-border focus:border-brand-400 focus:ring-brand-400/20"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
            
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
