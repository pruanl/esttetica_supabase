{
  "id": "evt_1SBiOdBe0ycHroRBN3pieuMu",
  "object": "event",
  "api_version": "2025-08-27.basil",
  "created": 1758919058,
  "data": {
    "object": {
      "id": "sub_1SAGUABe0ycHroRBHH0HMWOy",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1758573442,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "flexible": null,
        "type": "classic"
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1758573442,
      "currency": "brl",
      "customer": "cus_T66xzarl5v73XN",
      "days_until_due": null,
      "default_payment_method": "pm_1SAGUABe0ycHroRBf3bTVAPU",
      "default_source": null,
      "default_tax_rates": [
      ],
      "description": null,
      "discounts": [
      ],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_T6TR41zlO1VQ3e",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1758573443,
            "current_period_end": 1759005442,
            "current_period_start": 1758919042,
            "discounts": [
            ],
            "metadata": {
            },
            "plan": {
              "id": "price_1SAFNkBe0ycHroRBidLX2jgZ",
              "object": "plan",
              "active": true,
              "amount": 200,
              "amount_decimal": "200",
              "billing_scheme": "per_unit",
              "created": 1758569200,
              "currency": "brl",
              "interval": "day",
              "interval_count": 1,
              "livemode": false,
              "metadata": {
              },
              "meter": null,
              "nickname": null,
              "product": "prod_T5k7ztL8jPMaTG",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1SAFNkBe0ycHroRBidLX2jgZ",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1758569200,
              "currency": "brl",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {
              },
              "nickname": null,
              "product": "prod_T5k7ztL8jPMaTG",
              "recurring": {
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 200,
              "unit_amount_decimal": "200"
            },
            "quantity": 1,
            "subscription": "sub_1SAGUABe0ycHroRBHH0HMWOy",
            "tax_rates": [
            ]
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1SAGUABe0ycHroRBHH0HMWOy"
      },
      "latest_invoice": "in_1SBiOcBe0ycHroRBRzEtNcba",
      "livemode": false,
      "metadata": {
      },
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": [
          "card"
        ],
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1SAFNkBe0ycHroRBidLX2jgZ",
        "object": "plan",
        "active": true,
        "amount": 200,
        "amount_decimal": "200",
        "billing_scheme": "per_unit",
        "created": 1758569200,
        "currency": "brl",
        "interval": "day",
        "interval_count": 1,
        "livemode": false,
        "metadata": {
        },
        "meter": null,
        "nickname": null,
        "product": "prod_T5k7ztL8jPMaTG",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1758573442,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    },
    "previous_attributes": {
      "items": {
        "data": [
          {
            "id": "si_T6TR41zlO1VQ3e",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1758573443,
            "current_period_end": 1758919042,
            "current_period_start": 1758832642,
            "discounts": [
            ],
            "metadata": {
            },
            "plan": {
              "id": "price_1SAFNkBe0ycHroRBidLX2jgZ",
              "object": "plan",
              "active": true,
              "amount": 200,
              "amount_decimal": "200",
              "billing_scheme": "per_unit",
              "created": 1758569200,
              "currency": "brl",
              "interval": "day",
              "interval_count": 1,
              "livemode": false,
              "metadata": {
              },
              "meter": null,
              "nickname": null,
              "product": "prod_T5k7ztL8jPMaTG",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1SAFNkBe0ycHroRBidLX2jgZ",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1758569200,
              "currency": "brl",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {
              },
              "nickname": null,
              "product": "prod_T5k7ztL8jPMaTG",
              "recurring": {
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 200,
              "unit_amount_decimal": "200"
            },
            "quantity": 1,
            "subscription": "sub_1SAGUABe0ycHroRBHH0HMWOy",
            "tax_rates": [
            ]
          }
        ]
      },
      "latest_invoice": "in_1SBLv3Be0ycHroRBVFDhVCyC"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "customer.subscription.updated"
}