import { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Zap } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  tier?: 'premium' | 'pro';
  paymentMethod: 'stripe' | 'cashapp';
  purchaseType: 'subscription' | 'battles';
  battleCount?: number;
}

function PaymentForm({ tier, paymentMethod, purchaseType, battleCount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const successMessage = purchaseType === 'battles' 
          ? "Battle pack purchased! 10 battles added to your account."
          : `Welcome to ${tier === 'premium' ? 'Premium' : 'Pro'}! Enjoy unlimited battles.`;
        
        toast({
          title: "Payment Successful",
          description: successMessage,
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          defaultValues: {
            billingDetails: {
              name: '',
              email: ''
            }
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          purchaseType === 'battles' ? 
            (paymentMethod === 'cashapp' ? 
              `Buy 10 Battles with Cash App ($ILLAITHEGPTSTORE) - $1.00` :
              `Buy 10 Battles for $1.00`) :
            (paymentMethod === 'cashapp' ? 
              `Pay with Cash App ($ILLAITHEGPTSTORE) - $${tier === 'premium' ? '9.99' : '19.99'}/month` :
              `Subscribe to ${tier === 'premium' ? 'Premium' : 'Pro'} - $${tier === 'premium' ? '9.99' : '19.99'}/month`)
        )}
      </Button>
    </form>
  );
}

export default function Subscribe() {
  const [tier, setTier] = useState<'premium' | 'pro'>('premium');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cashapp'>('stripe');
  const [purchaseType, setPurchaseType] = useState<'subscription' | 'battles'>('subscription');
  const [clientSecret, setClientSecret] = useState<string>('');
  const { toast } = useToast();

  const createSubscription = useMutation({
    mutationFn: async (data: { tier: 'premium' | 'pro'; paymentMethod: 'stripe' | 'cashapp' }) => {
      const response = await apiRequest('POST', '/api/create-subscription', { 
        tier: data.tier,
        paymentMethod: data.paymentMethod 
      });
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🎉 Subscription API response:', data);
      console.log('🔑 Client secret received:', !!data.clientSecret);
      setClientSecret(data.clientSecret);
      toast({
        title: "Payment Ready",
        description: "Please complete your payment below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to initiate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createBattlePack = useMutation({
    mutationFn: async () => {
      // Use ThcaStore's one-time payment approach
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: 1.00, // $1.00 for 10 battles
        description: `10 Battle Pack ($0.10 per battle)`
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🎉 One-time payment intent created:', data);
      console.log('🔑 Client secret received:', !!data.clientSecret);
      setClientSecret(data.clientSecret);
      toast({
        title: "Payment Ready",
        description: "Please complete your battle pack purchase below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Error",
        description: error.message || "Failed to initiate battle pack purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTierSelect = (selectedTier: 'premium' | 'pro') => {
    setTier(selectedTier);
    setClientSecret('');
    if (purchaseType === 'subscription') {
      createSubscription.mutate({ tier: selectedTier, paymentMethod });
    }
  };

  const handlePurchaseTypeChange = (type: 'subscription' | 'battles') => {
    setPurchaseType(type);
    setClientSecret('');
    if (type === 'battles') {
      createBattlePack.mutate();
    } else {
      createSubscription.mutate({ tier, paymentMethod });
    }
  };

  const handlePaymentMethodChange = (method: 'stripe' | 'cashapp') => {
    setPaymentMethod(method);
    setClientSecret('');
    if (purchaseType === 'battles') {
      createBattlePack.mutate();
    } else {
      createSubscription.mutate({ tier, paymentMethod: method });
    }
  };

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-gray-400 text-lg">
              Upgrade to unlock unlimited rap battles and premium features
            </p>
          </div>

          {/* Purchase Type Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center">Choose Purchase Type</h2>
            <div className="flex justify-center gap-4">
              <Button
                variant={purchaseType === 'subscription' ? 'default' : 'outline'}
                onClick={() => handlePurchaseTypeChange('subscription')}
                className={`px-6 py-3 ${
                  purchaseType === 'subscription'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border-purple-500 text-purple-400 hover:bg-purple-600/20'
                }`}
                data-testid="button-select-subscription"
              >
                📅 Monthly Subscription
              </Button>
              <Button
                variant={purchaseType === 'battles' ? 'default' : 'outline'}
                onClick={() => handlePurchaseTypeChange('battles')}
                className={`px-6 py-3 ${
                  purchaseType === 'battles'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'border-amber-500 text-amber-400 hover:bg-amber-600/20'
                }`}
                data-testid="button-select-battles"
              >
                <Zap className="mr-2 h-4 w-4" />
                10 Battles for $1
              </Button>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center">Choose Payment Method</h2>
            <div className="flex justify-center gap-4">
              <Button
                variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('stripe')}
                className={`px-6 py-3 ${
                  paymentMethod === 'stripe'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border-purple-500 text-purple-400 hover:bg-purple-600/20'
                }`}
                data-testid="button-select-stripe"
              >
                💳 Credit Card
              </Button>
              <Button
                variant={paymentMethod === 'cashapp' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('cashapp')}
                className={`px-6 py-3 ${
                  paymentMethod === 'cashapp'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border-green-500 text-green-400 hover:bg-green-600/20'
                }`}
                data-testid="button-select-cashapp"
              >
                💰 Cash App ($ILLAITHEGPTSTORE)
              </Button>
            </div>
          </div>

          {purchaseType === 'battles' ? (
            <div className="flex justify-center">
              <Card className="bg-gray-800 border-amber-500/50 hover:border-amber-400 transition-colors max-w-md relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                    10¢ PER BATTLE
                  </span>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-amber-400 text-2xl flex items-center justify-center">
                    <Zap className="mr-2 h-6 w-6" />
                    Battle Pack
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Quick battles, no commitment
                  </CardDescription>
                  <div className="text-4xl font-bold text-white">
                    $1.00<span className="text-lg text-gray-400"> for 10 battles</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-gray-300 text-center">
                    <li>⚡ 10 instant battles</li>
                    <li>🤖 All AI characters</li>
                    <li>🎯 10¢ per battle</li>
                    <li>💳 One-time payment</li>
                    <li>🚀 No subscription needed</li>
                  </ul>
                  <Button
                    onClick={() => createBattlePack.mutate()}
                    disabled={createBattlePack.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    data-testid="button-purchase-battles"
                  >
                    {createBattlePack.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Buy 10 Battles for $1'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Plan */}
            <Card className="bg-gray-800 border-purple-500/50 hover:border-purple-400 transition-colors">
              <CardHeader>
                <CardTitle className="text-purple-400 text-2xl">Premium</CardTitle>
                <CardDescription className="text-gray-300">
                  Perfect for regular battlers
                </CardDescription>
                <div className="text-3xl font-bold text-white">
                  $9.99<span className="text-lg text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-gray-300">
                  <li>✓ 25 battles per day</li>
                  <li>✓ All AI characters</li>
                  <li>✓ Tournament mode</li>
                  <li>✓ Advanced scoring</li>
                  <li>✓ Lyric analysis</li>
                </ul>
                <Button
                  onClick={() => handleTierSelect('premium')}
                  disabled={createSubscription.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="button-select-premium"
                >
                  {createSubscription.isPending && tier === 'premium' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Choose Premium'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gray-800 border-amber-500/50 hover:border-amber-400 transition-colors relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                  BEST VALUE
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-amber-400 text-2xl">Pro</CardTitle>
                <CardDescription className="text-gray-300">
                  For serious rap battle champions
                </CardDescription>
                <div className="text-3xl font-bold text-white">
                  $19.99<span className="text-lg text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-gray-300">
                  <li>✓ Unlimited battles</li>
                  <li>✓ All AI characters</li>
                  <li>✓ Tournament mode</li>
                  <li>✓ Advanced scoring</li>
                  <li>✓ Lyric analysis</li>
                  <li>✓ Priority support</li>
                  <li>✓ Early access features</li>
                </ul>
                <Button
                  onClick={() => handleTierSelect('pro')}
                  disabled={createSubscription.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  data-testid="button-select-pro"
                >
                  {createSubscription.isPending && tier === 'pro' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Choose Pro'
                  )}
                </Button>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#1f2937',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center">
            Complete Your Subscription
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            {tier === 'premium' ? 'Premium Plan - $9.99/month' : 'Pro Plan - $19.99/month'}
          </CardDescription>
          <div className="text-center mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {paymentMethod === 'cashapp' ? '💰 Cash App → $ILLAITHEGPTSTORE' : '💳 Credit Card Payment'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={stripeOptions}>
            <PaymentForm tier={tier} paymentMethod={paymentMethod} purchaseType={purchaseType} battleCount={purchaseType === 'battles' ? 4 : undefined} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}