import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Mail, MessageSquare } from 'lucide-react'

export function HelpPage() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999'
  
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com o app Esttetica.')
    const url = `https://wa.me/${whatsappNumber}?text=${message}`
    window.open(url, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Precisa de Ajuda ou Tem uma Ideia?</h1>
      
      {/* Seção de Sugestões e Feedback */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Sugestões e Feedback</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Sua opinião é fundamental para a evolução da Esttetica. Se você tem uma sugestão para o dashboard, 
          uma ideia para uma nova funcionalidade, ou encontrou algo que podemos melhorar, adoraríamos ouvir.
        </p>
        <a 
          href="mailto:contato@estettica.com"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Envie sua sugestão para contato@estettica.com
        </a>
      </div>

      <Separator className="my-8" />

      {/* Seção de Suporte e Dúvidas */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Suporte e Dúvidas</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Se você está com alguma dúvida, precisa de ajuda com uma funcionalidade ou encontrou um problema, 
          nossa equipe está pronta para te ajudar. A forma mais rápida de falar conosco é pelo WhatsApp.
        </p>
        <Button 
          onClick={handleWhatsAppClick}
          className="flex items-center gap-2"
          size="lg"
        >
          <MessageSquare className="w-5 h-5" />
          Falar com um especialista no WhatsApp
        </Button>
      </div>
    </div>
  )
}