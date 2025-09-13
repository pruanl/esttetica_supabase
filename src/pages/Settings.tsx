import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Shield, Palette, Eye, EyeOff, LogOut, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  const handleChangePassword = async () => {
    // Validações
    if (!newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Preencha todos os campos' })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' })
      return
    }

    setIsChangingPassword(true)
    setPasswordMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setPasswordMessage({ 
          type: 'error', 
          text: error.message || 'Erro ao alterar senha' 
        })
      } else {
        setPasswordMessage({ 
          type: 'success', 
          text: 'Senha alterada com sucesso!' 
        })
        // Limpar campos
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Erro inesperado. Tente novamente.' 
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    setIsLoggingOutAll(true)
    
    try {
      // Primeiro, invalida todas as sessões no Supabase
      const { error } = await supabase.auth.admin.signOut(user?.id || '', 'global')
      
      if (error) {
        // Se não conseguir usar admin, usa o método padrão
        await supabase.auth.signOut({ scope: 'global' })
      }
      
      // Depois faz logout local
      await signOut()
    } catch (error) {
      console.error('Erro ao desconectar de todas as sessões:', error)
      // Mesmo com erro, faz logout local
      await signOut()
    } finally {
      setIsLoggingOutAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="grid gap-6">

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie sua senha e configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações da Conta */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email da Conta</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            {/* Alteração de Senha */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Alterar Senha</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Informação</Label>
                  <p className="text-sm text-muted-foreground">
                    Para alterar sua senha, digite a nova senha nos campos abaixo. 
                    O Supabase irá solicitar confirmação por email se necessário.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {passwordMessage && (
                  <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>{passwordMessage.text}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </div>

            {/* Gerenciamento de Sessões */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Gerenciamento de Sessões</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sessão Atual</p>
                    <p className="text-xs text-muted-foreground">Este dispositivo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">Ativo</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleLogoutAllSessions}
                  disabled={isLoggingOutAll}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOutAll ? 'Desconectando...' : 'Desconectar de Todos os Dispositivos'}
                </Button>
              </div>
            </div>

            {/* Autenticação de Dois Fatores */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Autenticação de Dois Fatores</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">2FA</p>
                    <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Em breve</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              Configurar Tema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}