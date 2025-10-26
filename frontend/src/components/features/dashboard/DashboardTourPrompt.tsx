import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '../../ui/dialog';
import { Progress } from '../../ui/progress';

type TourStep = {
	id: string;
	title: string;
	description: string;
	highlights?: string[];
	primaryActionLabel?: string;
};

const TOUR_STEPS: TourStep[] = [
	{
		id: 'welcome',
		title: 'Welcome to your personalized space',
		description: 'This dashboard adapts to your goals. We will highlight the areas where you can check in, explore guidance, and review progress at a glance.'
	},
	{
		id: 'check-in',
		title: 'Start with a daily check-in',
		description: 'Use the mood cards to log how you are feeling today. Each check-in keeps your wellness graph up to date and nudges the assistant to tailor suggestions.',
		highlights: [
			'Log a mood in seconds with the emoji cards',
			'See your streak and celebrate consistency',
			'Quick links guide you to soothing practices when you need them most'
		]
	},
	{
		id: 'assessments',
		title: 'Track assessments & insights',
		description: 'Assessment results surface here with clear interpretations so you can spot meaningful shifts over time.',
		highlights: [
			'Review your latest scores with simple labels',
			'Compare trends across anxiety, stress, and EI',
			'Download detailed insights once you finish an assessment'
		]
	},
	{
		id: 'recommendations',
		title: 'Explore tailored recommendations',
		description: 'Your plan, practices, and library suggestions update with every interaction. Pin favourites to keep them handy on the dashboard.',
		highlights: [
			'Launch the AI companion for in-the-moment coaching',
			'Save practices or content to revisit later',
			'Swap widgets in the dashboard customiser to match your routine'
		]
	}
];

export interface DashboardTourPromptProps {
	open: boolean;
	onSkip: () => void;
	onComplete: () => void;
}

export const DashboardTourPrompt: React.FC<DashboardTourPromptProps> = ({ open, onSkip, onComplete }) => {
	const [stepIndex, setStepIndex] = useState(0);

	useEffect(() => {
		if (open) {
			setStepIndex(0);
		}
	}, [open]);

	const progressValue = useMemo(() => {
		if (TOUR_STEPS.length === 0) {
			return 0;
		}
		return ((stepIndex + 1) / TOUR_STEPS.length) * 100;
	}, [stepIndex]);

	const activeStep = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === TOUR_STEPS.length - 1;

	const handleClose = () => {
		onSkip();
	};

	const handleNext = () => {
		if (isLastStep) {
			onComplete();
			return;
		}
		setStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
	};

	const handlePrevious = () => {
		setStepIndex((prev) => Math.max(prev - 1, 0));
	};

	return (
		<Dialog open={open} onOpenChange={(value) => {
			if (!value) {
				handleClose();
			}
		}}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>{activeStep.title}</DialogTitle>
					<DialogDescription>{activeStep.description}</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					<Progress value={progressValue} className="h-2" />
					{activeStep.highlights && (
						<ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
							{activeStep.highlights.map((highlight) => (
								<li key={highlight}>{highlight}</li>
							))}
						</ul>
					)}
				</div>

				<DialogFooter className="pt-4">
					<div className="flex flex-1 items-center justify-between gap-3">
						<Button variant="ghost" onClick={handleClose}>
							Skip tour
						</Button>
						<div className="flex items-center gap-2">
							<Button variant="outline" onClick={handlePrevious} disabled={isFirstStep}>
								Back
							</Button>
							<Button onClick={handleNext}>
								{isLastStep ? 'Finish tour' : 'Next'}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DashboardTourPrompt;
