import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

async function setupStripeProducts() {
  try {
    console.log('🚀 Setting up Stripe products for Battle Rap App...');

    // Create Premium Product
    const premiumProduct = await stripe.products.create({
      name: "Battle Rap Premium",
      description: "25 battles per day, advanced AI opponents, premium voices, battle analysis",
      images: [], // Add product images later if needed
      metadata: {
        tier: 'premium',
        app: 'battle-rap'
      }
    });

    console.log('✅ Premium Product created:', premiumProduct.id);

    // Create Premium Price ($9.99/month)
    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 999, // $9.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      nickname: 'Premium Monthly',
      lookup_key: 'battle_rap_premium_monthly',
      metadata: {
        tier: 'premium',
        app: 'battle-rap'
      }
    });

    console.log('✅ Premium Price created:', premiumPrice.id);

    // Create Pro Product
    const proProduct = await stripe.products.create({
      name: "Battle Rap Pro",
      description: "Unlimited battles, all AI opponents, custom voices, advanced analytics, tournament mode",
      images: [], // Add product images later if needed
      metadata: {
        tier: 'pro',
        app: 'battle-rap'
      }
    });

    console.log('✅ Pro Product created:', proProduct.id);

    // Create Pro Price ($19.99/month)
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1999, // $19.99 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      nickname: 'Pro Monthly',
      lookup_key: 'battle_rap_pro_monthly',
      metadata: {
        tier: 'pro',
        app: 'battle-rap'
      }
    });

    console.log('✅ Pro Price created:', proPrice.id);

    // Display environment variables to set
    console.log('\n🔧 Add these environment variables to your .env file:');
    console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
    console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`STRIPE_PREMIUM_PRODUCT_ID=${premiumProduct.id}`);
    console.log(`STRIPE_PRO_PRODUCT_ID=${proProduct.id}`);

    console.log('\n✅ Stripe products and prices setup complete!');
    
    return {
      premium: {
        productId: premiumProduct.id,
        priceId: premiumPrice.id
      },
      pro: {
        productId: proProduct.id,
        priceId: proPrice.id
      }
    };

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    throw error;
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupStripeProducts()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export { setupStripeProducts };