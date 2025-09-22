-- Script para corrigir a assinatura existente
-- Atualizando o registro com ID: 95b9f0bd-73d2-4b26-8f64-23c5a0315a9e

UPDATE subscriptions 
SET 
  stripe_subscription_id = 'sub_test_active_123',
  status = 'active',
  plan_name = 'Premium Monthly',
  price_id = 'price_monthly_premium'
WHERE id = '95b9f0bd-73d2-4b26-8f64-23c5a0315a9e';

-- Verificar se a atualização funcionou
SELECT * FROM subscriptions WHERE user_id = 'f3ead7ee-65fb-4d88-865b-0ed47051efc0';