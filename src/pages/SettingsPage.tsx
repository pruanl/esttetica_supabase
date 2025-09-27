import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Settings, Shield, Palette, User, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

export const SettingsPage: React.FC = () => {
  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Estados para controle de erros
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  // Função para alterar senha
  const handleChangePassword = async () => {
    console.log('🔄 Botão de alterar senha clicado!')
    console.log('📝 Dados:', { currentPassword: '***', newPassword: '***', confirmPassword: '***' })
    
    // Limpar erros anteriores
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    let hasErrors = false
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    // Validações básicas
    if (!currentPassword) {
      newErrors.currentPassword = 'Por favor, digite sua senha atual'
      hasErrors = true
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Por favor, digite uma nova senha'
      hasErrors = true
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'A nova senha deve ter pelo menos 6 caracteres'
      hasErrors = true
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme sua nova senha'
      hasErrors = true
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
      hasErrors = true
    }
    
    if (hasErrors) {
      setErrors(newErrors)
      toast.error('Por favor, corrija os erros nos campos')
      return
    }
    
    console.log('✅ Validações passaram, iniciando alteração...')
    setIsChangingPassword(true)
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Usuário:', user ? 'Autenticado' : 'Não autenticado')
      
      if (!user || !user.email) {
        console.log('❌ Usuário não autenticado ou sem email')
        toast.error('Usuário não autenticado')
        return
      }
      
      // Verificar se a senha atual está correta
      console.log('🔐 Verificando senha atual...')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      
      if (signInError) {
        console.log('❌ Senha atual incorreta:', signInError)
        setErrors(prev => ({ ...prev, currentPassword: 'Senha atual incorreta' }))
        toast.error('Senha atual incorreta')
        return
      }
      
      console.log('✅ Senha atual verificada, alterando senha...')
      
      // Tentar alterar a senha
      console.log('🔐 Chamando updateUser...')
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.log('❌ Erro ao alterar senha:', error)
        
        // Traduzir mensagens de erro específicas
        if (error.code === 'same_password') {
          setErrors(prev => ({ ...prev, newPassword: 'A nova senha deve ser diferente da senha atual' }))
          toast.error('A nova senha deve ser diferente da senha atual')
        } else {
          toast.error(`Erro ao alterar senha: ${error.message}`)
        }
      } else {
        console.log('✅ Senha alterada com sucesso!')
        toast.success('Senha alterada com sucesso!')
        // Limpar campos
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Limpar erros
        setErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.log('❌ Erro inesperado:', error)
      toast.error('Erro inesperado ao alterar senha')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="grid gap-6">
        
        {/* Perfil da Clínica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil da Clínica
            </CardTitle>
            <CardDescription>
              Configure as informações que aparecerão na sua página pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-start sm:justify-end">
              <Link to="/profile/clinic">
                <Button size="sm" className="w-auto">
                  Gerenciar Perfil Público
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      
        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input 
                id="current-password" 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className={errors.currentPassword ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-500">{errors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className={errors.newPassword ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className={errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex justify-start sm:justify-end">
              <Button 
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                size="sm"
                className="w-auto"
              >
                {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema Escuro</p>
                <p className="text-sm text-muted-foreground">Ative o modo escuro no canto superior direito.</p>
              </div>
            
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}