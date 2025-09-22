#!/bin/bash

# Script para fazer deploy das funções do Supabase
echo "Fazendo deploy das funções do Supabase..."

# Instalar CLI do Supabase via curl
echo "Instalando Supabase CLI..."
curl -sSfL https://supabase.com/install.sh | sh

# Adicionar ao PATH
export PATH=$PATH:$HOME/.local/bin

# Login no Supabase (você precisará fazer isso manualmente)
echo "Faça login no Supabase:"
echo "supabase login"

# Deploy das funções
echo "Deploy da função create-checkout-session..."
supabase functions deploy create-checkout-session

echo "Deploy da função stripe-webhook-handler..."
supabase functions deploy stripe-webhook-handler

echo "Deploy da função create-billing-portal-session..."
supabase functions deploy create-billing-portal-session

echo "Deploy concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure o webhook no Stripe Dashboard"
echo "2. Use a URL: https://[seu-projeto].supabase.co/functions/v1/stripe-webhook-handler"
echo "3. Eventos necessários: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"