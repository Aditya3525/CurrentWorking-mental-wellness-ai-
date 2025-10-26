import { Award, Calendar, Flame, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';

export interface StreakData {
	currentStreak: number;
	longestStreak: number;
	totalCheckIns: number;
	thisWeekCheckIns: number;
	lastCheckInDate?: string; // YYYY-MM-DD
}

export interface StreakTrackerProps {
	data: StreakData;
}

const MILESTONES = [
	{ days: 3, label: 'Getting Started', icon: '🌱', color: 'text-green-600' },
	{ days: 7, label: 'One Week Strong', icon: '⭐', color: 'text-blue-600' },
	{ days: 14, label: 'Two Weeks!', icon: '🎯', color: 'text-purple-600' },
	{ days: 30, label: 'Monthly Warrior', icon: '🏆', color: 'text-yellow-600' },
	{ days: 60, label: 'Consistency Champion', icon: '👑', color: 'text-orange-600' },
	{ days: 90, label: '90-Day Legend', icon: '💎', color: 'text-pink-600' },
	{ days: 180, label: 'Half-Year Hero', icon: '🌟', color: 'text-indigo-600' },
	{ days: 365, label: 'Year of Growth', icon: '🎊', color: 'text-red-600' }
];

export const StreakTracker: React.FC<StreakTrackerProps> = ({ data }) => {
	const currentMilestone = useMemo(() => {
		return MILESTONES.reduce((prev, curr) => {
			if (data.currentStreak >= curr.days) {
				return curr;
			}
			return prev;
		}, MILESTONES[0]);
	}, [data.currentStreak]);

	const nextMilestone = useMemo(() => {
		return MILESTONES.find(m => m.days > data.currentStreak) || MILESTONES[MILESTONES.length - 1];
	}, [data.currentStreak]);

	const progressToNext = useMemo(() => {
		if (data.currentStreak >= nextMilestone.days) {
			return 100;
		}

		const prevMilestone = MILESTONES.reduce((prev, curr) => {
			if (curr.days <= data.currentStreak && curr.days > prev.days) {
				return curr;
			}
			return prev;
		}, MILESTONES[0]);

		const range = nextMilestone.days - prevMilestone.days;
		const progress = data.currentStreak - prevMilestone.days;

		return Math.round((progress / range) * 100);
	}, [data.currentStreak, nextMilestone]);

	const streakStatus = useMemo(() => {
		if (!data.lastCheckInDate) {
			return { isActive: false, message: 'Start your first check-in today!' };
		}

		const lastCheckIn = new Date(data.lastCheckInDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		lastCheckIn.setHours(0, 0, 0, 0);

		const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

		if (daysDiff === 0) {
			return { isActive: true, message: 'Checked in today! 🎉' };
		} else if (daysDiff === 1) {
			return { isActive: true, message: 'Check in today to keep your streak!' };
		} else {
			return { isActive: false, message: `Streak ended ${daysDiff} days ago. Start fresh!` };
		}
	}, [data.lastCheckInDate]);

	const weekProgress = Math.round((data.thisWeekCheckIns / 7) * 100);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<Flame className={`h-5 w-5 ${streakStatus.isActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
					Streak Tracker
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Current Streak */}
				<div className="text-center space-y-2">
					<div className="text-5xl font-bold text-primary">
						{data.currentStreak}
					</div>
					<div className="text-sm text-muted-foreground">
						{data.currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
					</div>
					<p className={`text-xs ${streakStatus.isActive ? 'text-green-600' : 'text-orange-600'}`}>
						{streakStatus.message}
					</p>
				</div>

				{/* Current Milestone */}
				{data.currentStreak >= 3 && (
					<div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
						<div className="text-2xl mb-1">{currentMilestone.icon}</div>
						<div className={`font-semibold ${currentMilestone.color}`}>
							{currentMilestone.label}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							{currentMilestone.days} days achieved!
						</div>
					</div>
				)}

				{/* Progress to Next Milestone */}
				{data.currentStreak < nextMilestone.days && (
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Next milestone</span>
							<span className="font-medium">
								{nextMilestone.days - data.currentStreak} days to go
							</span>
						</div>
						<Progress value={progressToNext} className="h-2" />
						<div className="text-center">
							<span className="text-xs text-muted-foreground">
								{nextMilestone.icon} {nextMilestone.label}
							</span>
						</div>
					</div>
				)}

				{/* This Week Progress */}
				<div className="space-y-2 pt-4 border-t">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">This Week</span>
						</div>
						<Badge variant="secondary">
							{data.thisWeekCheckIns}/7 days
						</Badge>
					</div>
					<Progress value={weekProgress} className="h-2" />
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 gap-4 pt-4 border-t">
					<div className="text-center">
						<div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
							<Award className="h-4 w-4" />
						</div>
						<div className="text-2xl font-semibold">{data.longestStreak}</div>
						<div className="text-xs text-muted-foreground">Longest Streak</div>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
							<TrendingUp className="h-4 w-4" />
						</div>
						<div className="text-2xl font-semibold">{data.totalCheckIns}</div>
						<div className="text-xs text-muted-foreground">Total Check-ins</div>
					</div>
				</div>

				{/* Upcoming Milestones */}
				{data.currentStreak >= 3 && (
					<div className="pt-4 border-t">
						<div className="text-xs font-semibold text-muted-foreground mb-2">
							Upcoming Milestones
						</div>
						<div className="flex gap-2 overflow-x-auto pb-2">
							{MILESTONES.filter(m => m.days > data.currentStreak).slice(0, 4).map(milestone => (
								<div
									key={milestone.days}
									className="flex-shrink-0 text-center p-2 bg-muted/50 rounded-lg min-w-[60px]"
								>
									<div className="text-lg">{milestone.icon}</div>
									<div className="text-xs font-medium mt-1">{milestone.days}</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
