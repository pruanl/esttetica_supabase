import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Loader2, Crown, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  description: string
  icon: React.ReactNode
  features: PlanFeature[]
  monthlyPrice: number
  yearlyPrice: number
  monthlyPriceId: string
  yearlyPriceId: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    name: 'Diário',
    description: 'Plano de teste diário para sua clínica',
    icon: <Sparkles className="h-6 w-6" />,
    monthlyPrice: 2.99,
    yearlyPrice: 2.99,
    monthlyPriceId: 'price_1SAFNkBe0ycHroRBidLX2jgZ', // Price ID para teste diário
    yearlyPriceId: 'price_1SAFNkBe0ycHroRBidLX2jgZ', // Mesmo price ID para teste
    popular: false,
    features: [
      { text: 'Acesso por 1 dia', included: true },
      { text: 'Pacientes ilimitados', included: true },
      { text: 'Agendamentos ilimitados', included: true },
      { text: 'Controle financeiro completo', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'Perfil público personalizado', included: true },
      { text: 'Lembretes automáticos', included: true },
      { text: 'Suporte prioritário', included: true },
    ]
  },
  {
    name: 'Mensal',
    description: 'Plano completo para sua clínica de estética',
    icon: <Crown className="h-6 w-6" />,
    monthlyPrice: 49.90,
    yearlyPrice: 478.80,
    monthlyPriceId: 'price_1S9YdXBe0ycHroRB9sDH7MJO', // Substitua pelo ID real do Stripe
    yearlyPriceId: 'price_1S9YdXBe0ycHroRBqz8Yr30h', // Substitua pelo ID real do Stripe
    popular: false,
    features: [
      { text: 'Pacientes ilimitados', included: true },
      { text: 'Agendamentos ilimitados', included: true },
      { text: 'Controle financeiro completo', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'Perfil público personalizado', included: true },
      { text: 'Lembretes automáticos', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Backup automático', included: true },
    ]
  },
  {
    name: 'Anual',
    description: 'Plano completo para sua clínica de estética',
    icon: <Crown className="h-6 w-6" />,
    monthlyPrice: 49.90,
    yearlyPrice: 478.80,
    monthlyPriceId: 'price_1S9YdXBe0ycHroRB9sDH7MJO', // Substitua pelo ID real do Stripe
    yearlyPriceId: 'price_1S9YdXBe0ycHroRBqz8Yr30h', // Substitua pelo ID real do Stripe
    popular: true,
    features: [
      { text: 'Pacientes ilimitados', included: true },
      { text: 'Agendamentos ilimitados', included: true },
      { text: 'Controle financeiro completo', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'Perfil público personalizado', included: true },
      { text: 'Lembretes automáticos', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Backup automático', included: true },
    ]
  }
]

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoadingPlan(priceId)
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Você precisa estar logado para assinar um plano')
      }

      // Call our Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { price_id: priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        throw error
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe não pôde ser carregado')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error)
      alert('Erro ao processar assinatura. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12
    const savings = monthlyCost - yearlyPrice
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { savings, percentage }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Escolha o plano ideal para sua clínica
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Gerencie seus pacientes, agendamentos e finanças com facilidade
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isDaily = plan.name === 'Diário'
            const isMonthly = plan.name === 'Mensal'
            const isYearly = plan.name === 'Anual'
            
            let displayPrice = plan.monthlyPrice
            let priceId = plan.monthlyPriceId
            let priceLabel = 'por mês'
            
            if (isDaily) {
              displayPrice = plan.monthlyPrice
              priceId = plan.monthlyPriceId
              priceLabel = 'por dia'
            } else if (isYearly) {
              displayPrice = 39.90
              priceId = plan.yearlyPriceId
              priceLabel = 'por mês'
            }
            
            return (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : 'border-border'}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary text-primary-foreground">
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      R$ {displayPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-muted-foreground">
                      {priceLabel}
                      {isYearly && (
                        <div>
                          <span className="text-sm">12x de</span>
                          <div className="text-xs text-muted-foreground/70 mt-1">
                            Total: R$ 478,80/ano
                          </div>
                        </div>
                      )}
                    </div>
                    {isYearly && (
                      <div className="text-sm text-green-600 mt-2">
                        Economize R$ 120,00 no plano anual!
                      </div>
                    )}
                    {isDaily && (
                      <div className="text-sm text-blue-600 mt-2">
                        Ideal para testes e avaliação!
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check 
                          className={`h-4 w-4 ${
                            feature.included 
                              ? 'text-green-500' 
                              : 'text-muted-foreground opacity-50'
                          }`} 
                        />
                        <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(priceId)}
                    disabled={loadingPlan === priceId}
                  >
                    {loadingPlan === priceId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p className="mb-2">✅ Cancele a qualquer momento</p>
          <p className="mb-2">🔒 Pagamento seguro com Stripe</p>
          <p>📞 Suporte especializado em português</p>
        </div>
      </div>
    </div>
  )
}