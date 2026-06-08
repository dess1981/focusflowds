import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function Onboarding() {
  const navigate = useNavigate();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const user = await base44.auth.me();
      // Se tem categories ou projects, já foi onboarded
      const categories = await base44.entities.Category.list();
      const projects = await base44.entities.Project.list();
      
      if (categories.length > 0 || projects.length > 0) {
        setHasCompletedOnboarding(true);
        navigate('/');
      } else {
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      setHasCompletedOnboarding(false);
    }
  };

  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <OnboardingWizard
      onComplete={() => {
        // Marca onboarding como completo e redireciona
        localStorage.setItem('onboarding_completed', 'true');
        navigate('/');
      }}
    />
  );
}