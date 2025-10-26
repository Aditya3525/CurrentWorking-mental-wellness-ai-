import { Eye, EyeOff, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';

export type DashboardWidget = 
	| 'mood-check'
	| 'assessment-scores'
	| 'today-practice'
	| 'quick-actions'
	| 'recent-insights'
	| 'this-week'
	| 'navigation-shortcuts';

export interface WidgetVisibility {
	'mood-check': boolean;
	'assessment-scores': boolean;
	'today-practice': boolean;
	'quick-actions': boolean;
	'recent-insights': boolean;
	'this-week': boolean;
	'navigation-shortcuts': boolean;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
	'mood-check': true,
	'assessment-scores': true,
	'today-practice': true,
	'quick-actions': true,
	'recent-insights': true,
	'this-week': true,
	'navigation-shortcuts': true
};

const WIDGET_LABELS: Record<DashboardWidget, string> = {
	'mood-check': 'Quick Mood Check',
	'assessment-scores': 'Assessment Scores',
	'today-practice': "Today's Practice",
	'quick-actions': 'Quick Actions',
	'recent-insights': 'Recent Insights',
	'this-week': 'This Week',
	'navigation-shortcuts': 'Navigation Shortcuts'
};

const CORE_WIDGETS: DashboardWidget[] = ['mood-check', 'assessment-scores', 'today-practice', 'quick-actions'];
const INSIGHT_WIDGETS: DashboardWidget[] = ['recent-insights', 'this-week'];
const SUPPORT_WIDGETS: DashboardWidget[] = ['navigation-shortcuts'];

const STORAGE_KEY = 'mw-dashboard-widget-visibility';

export interface DashboardCustomizerProps {
	visibility: WidgetVisibility;
	onVisibilityChange: (visibility: WidgetVisibility) => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
	visibility,
	onVisibilityChange
}) => {
	const [open, setOpen] = useState(false);
	const [localVisibility, setLocalVisibility] = useState<WidgetVisibility>(visibility);

	useEffect(() => {
		setLocalVisibility(visibility);
	}, [visibility]);

	const handleToggle = useCallback((widget: DashboardWidget) => {
		setLocalVisibility(prev => ({
			...prev,
			[widget]: !prev[widget]
		}));
	}, []);

	const handleSave = useCallback(() => {
		onVisibilityChange(localVisibility);
		setOpen(false);
	}, [localVisibility, onVisibilityChange]);

	const handleReset = useCallback(() => {
		setLocalVisibility(DEFAULT_VISIBILITY);
	}, []);

	const handleCancel = useCallback(() => {
		setLocalVisibility(visibility);
		setOpen(false);
	}, [visibility]);

	const visibleCount = Object.values(localVisibility).filter(Boolean).length;
	const totalCount = Object.keys(localVisibility).length;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Settings className="h-4 w-4" />
					Customize Dashboard
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Customize Your Dashboard</DialogTitle>
					<DialogDescription>
						Show or hide widgets to personalize your dashboard. Your preferences will be saved automatically.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="flex items-center justify-between pb-4 border-b">
						<div className="space-y-1">
							<p className="text-sm font-medium">Visible Widgets</p>
							<p className="text-xs text-muted-foreground">
								{visibleCount} of {totalCount} widgets shown
							</p>
						</div>
						<Button variant="ghost" size="sm" onClick={handleReset}>
							Reset to Default
						</Button>
					</div>

					<div className="space-y-4">
						<div className="space-y-3">
							<h4 className="text-sm font-semibold text-muted-foreground">Core Widgets</h4>
							{CORE_WIDGETS.map(widget => (
								<div key={widget} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
									<Label htmlFor={widget} className="flex items-center gap-3 cursor-pointer flex-1">
										{localVisibility[widget] ? (
											<Eye className="h-4 w-4 text-primary" />
										) : (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										)}
										<span>{WIDGET_LABELS[widget]}</span>
									</Label>
									<Switch
										id={widget}
										checked={localVisibility[widget]}
										onCheckedChange={() => handleToggle(widget)}
									/>
								</div>
							))}
						</div>

						<div className="space-y-3">
							<h4 className="text-sm font-semibold text-muted-foreground">Insights & Progress</h4>
							{INSIGHT_WIDGETS.map(widget => (
								<div key={widget} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
									<Label htmlFor={widget} className="flex items-center gap-3 cursor-pointer flex-1">
										{localVisibility[widget] ? (
											<Eye className="h-4 w-4 text-primary" />
										) : (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										)}
										<span>{WIDGET_LABELS[widget]}</span>
									</Label>
									<Switch
										id={widget}
										checked={localVisibility[widget]}
										onCheckedChange={() => handleToggle(widget)}
									/>
								</div>
							))}
						</div>

						<div className="space-y-3">
							<h4 className="text-sm font-semibold text-muted-foreground">Tracking & Analytics</h4>
							{SUPPORT_WIDGETS.map(widget => (
								<div key={widget} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
									<Label htmlFor={widget} className="flex items-center gap-3 cursor-pointer flex-1">
										{localVisibility[widget] ? (
											<Eye className="h-4 w-4 text-primary" />
										) : (
											<EyeOff className="h-4 w-4 text-muted-foreground" />
										)}
										<span>{WIDGET_LABELS[widget]}</span>
									</Label>
									<Switch
										id={widget}
										checked={localVisibility[widget]}
										onCheckedChange={() => handleToggle(widget)}
									/>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSave}>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const useWidgetVisibility = () => {
	const [visibility, setVisibility] = useState<WidgetVisibility>(() => {
		if (typeof window === 'undefined') {
			return DEFAULT_VISIBILITY;
		}
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				return DEFAULT_VISIBILITY;
			}
			const parsed = JSON.parse(stored) as Partial<WidgetVisibility>;
			return { ...DEFAULT_VISIBILITY, ...parsed };
		} catch (error) {
			console.warn('Failed to load dashboard widget visibility:', error);
			return DEFAULT_VISIBILITY;
		}
	});

	const updateVisibility = useCallback((newVisibility: WidgetVisibility) => {
		setVisibility(newVisibility);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
		} catch (error) {
			console.warn('Failed to persist dashboard widget visibility:', error);
		}
	}, []);

	return {
		visibility,
		updateVisibility,
		isVisible: useCallback((widget: DashboardWidget) => visibility[widget], [visibility])
	};
};
