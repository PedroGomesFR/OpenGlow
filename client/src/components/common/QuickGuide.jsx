import { useState } from 'react';
import '../css/QuickGuide.css';
import { useTranslation } from 'react-i18next';

function QuickGuide({ isProfessional }) {
    const [showGuide, setShowGuide] = useState(false);
    const { t } = useTranslation();

    const professionalSteps = [
        {
            title: t('quick_guide_pro_step_1_title'),
            description: t('quick_guide_pro_step_1_desc')
        },
        {
            title: t('quick_guide_pro_step_2_title'),
            description: t('quick_guide_pro_step_2_desc')
        },
        {
            title: t('quick_guide_pro_step_3_title'),
            description: t('quick_guide_pro_step_3_desc')
        },
        {
            title: t('quick_guide_pro_step_4_title'),
            description: t('quick_guide_pro_step_4_desc')
        },
        {
            title: t('quick_guide_pro_step_5_title'),
            description: t('quick_guide_pro_step_5_desc')
        }
    ];

    const clientSteps = [
        {
            title: t('quick_guide_client_step_1_title'),
            description: t('quick_guide_client_step_1_desc')
        },
        {
            title: t('quick_guide_client_step_2_title'),
            description: t('quick_guide_client_step_2_desc')
        },
        {
            title: t('quick_guide_client_step_3_title'),
            description: t('quick_guide_client_step_3_desc')
        },
        {
            title: t('quick_guide_client_step_4_title'),
            description: t('quick_guide_client_step_4_desc')
        }
    ];

    const steps = isProfessional ? professionalSteps : clientSteps;

    return (
        <div className="quick-guide">
            <button 
                className="help-button"
                onClick={() => setShowGuide(!showGuide)}
                title={t('quick_guide_title')}
            >
                💡
            </button>

            {showGuide && (
                <div className="guide-popup">
                    <div className="guide-header">
                        <h3>{t('quick_guide_header')}</h3>
                        <button className="guide-close" onClick={() => setShowGuide(false)}>
                            ✕
                        </button>
                    </div>
                    <div className="guide-steps">
                        {steps.map((step, index) => (
                            <div key={index} className="guide-step">
                                <div className="step-number">{index + 1}</div>
                                <div className="step-content">
                                    <h4>{step.title}</h4>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuickGuide;
