import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  onboardingSteps,
  getOnboardingState,
  goToNextStep,
  goToPreviousStep,
  skipOnboarding,
  completeOnboarding,
  getElementPosition,
  calculateTooltipPosition
} from '../../utils/onboardingUtils';

/**
 * オンボーディングツアーコンポーネント
 */
export const OnboardingTour = ({ darkMode, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetPosition, setTargetPosition] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  const currentStep = onboardingSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;

  // 要素の位置を更新
  const updatePositions = useCallback(() => {
    if (currentStep.target) {
      const position = getElementPosition(currentStep.target);
      setTargetPosition(position);

      if (position && tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const calculatedPosition = calculateTooltipPosition(
          position,
          currentStep.position,
          tooltipRect.width,
          tooltipRect.height
        );
        setTooltipPosition(calculatedPosition);
      }
    } else {
      setTargetPosition(null);
      // 中央表示
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: window.innerHeight / 2 - tooltipRect.height / 2,
          left: window.innerWidth / 2 - tooltipRect.width / 2
        });
      }
    }
  }, [currentStep]);

  // 初期位置計算とリサイズ監視
  useEffect(() => {
    // 少し遅延させて要素のレンダリングを待つ
    const timer = setTimeout(updatePositions, 100);

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [updatePositions]);

  // 次へ
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      const newState = goToNextStep();
      setCurrentStepIndex(newState.currentStep);
    }
  };

  // 戻る
  const handlePrevious = () => {
    if (!isFirstStep) {
      const newState = goToPreviousStep();
      setCurrentStepIndex(newState.currentStep);
    }
  };

  // スキップ
  const handleSkip = () => {
    skipOnboarding();
    if (onComplete) onComplete();
  };

  // 完了
  const handleComplete = () => {
    completeOnboarding();
    if (onComplete) onComplete();
  };

  // スタイル定義
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-[9998]">
        {/* 背景暗転 */}
        <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* ターゲット要素のハイライト */}
        {targetPosition && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: targetPosition.top - 8,
              left: targetPosition.left - 8,
              width: targetPosition.width + 16,
              height: targetPosition.height + 16,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              transition: 'all 0.3s ease-in-out'
            }}
          />
        )}
      </div>

      {/* ツールチップ */}
      <div
        ref={tooltipRef}
        className={`fixed z-[9999] ${bgColor} ${textColor} rounded-xl shadow-2xl border ${borderColor} max-w-md transition-all duration-300`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }}
      >
        {/* ヘッダー */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                {currentStep.title}
              </h3>
              <p className={`text-sm ${textSecondary}`}>
                ステップ {currentStepIndex + 1} / {onboardingSteps.length}
              </p>
            </div>
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${textSecondary}`}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* 進捗バー */}
          <div className={`w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 pb-6">
          <p className={`text-base ${textColor} leading-relaxed`}>
            {currentStep.description}
          </p>
        </div>

        {/* フッター */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${borderColor}`}>
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isFirstStep
                ? 'opacity-50 cursor-not-allowed'
                : `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
            } ${textColor} transition-colors`}
          >
            <ChevronLeft size={18} />
            戻る
          </button>

          <div className="flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'bg-blue-500 w-6'
                    : index < currentStepIndex
                    ? 'bg-blue-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLastStep
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors font-medium`}
          >
            {isLastStep ? (
              <>
                完了
                <Check size={18} />
              </>
            ) : (
              <>
                次へ
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
