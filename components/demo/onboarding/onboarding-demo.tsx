import { Onboarding, useOnboarding } from '@/components/ui/onboarding';
import { Text } from '@/components/ui/text';

export const OnboardingPresets = {
  fintrack: [
    {
      id: 'welcome',
      title: 'Welcome to FinTrack',
      description: 'Track your money, powered by AI. Get a clear view of your financial health.',
      icon: <Text style={{ fontSize: 80 }}>💸</Text>,
      backgroundColor: 'black',
    },
    {
      id: 'transactions',
      title: 'Smart Transactions',
      description: 'Add transactions manually or let our AI assistant do it for you.',
      icon: <Text style={{ fontSize: 80 }}>🤖</Text>,
      backgroundColor: 'black',
    },
    {
      id: 'insights',
      title: 'Gain Insights',
      description: 'Understand your spending habits with clear charts and categorized data.',
      icon: <Text style={{ fontSize: 80 }}>📊</Text>,
      backgroundColor: 'black',
    },
    {
      id: 'ready',
      title: "You're All Set!",
      description: "Let's set up your starting balance and currency to get started.",
      icon: <Text style={{ fontSize: 80 }}>🚀</Text>,
      backgroundColor: 'black',
    },
  ],
};

export function OnboardingDemo({ onDone }: { onDone?: () => void }) {
  const { completeOnboarding, skipOnboarding } = useOnboarding();

  const handleComplete = () => {
    completeOnboarding();
    if (onDone) onDone();
  };

  const handleSkip = () => {
    skipOnboarding();
    if (onDone) onDone();
  };

  return (
    <Onboarding
      steps={OnboardingPresets.fintrack}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showSkip={true}
      showProgress={true}
      swipeEnabled={true}
      primaryButtonText='Get Started'
      skipButtonText='Skip'
      nextButtonText='Next'
      backButtonText='Back'
    />
  );
}
