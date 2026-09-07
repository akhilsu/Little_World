"use client";

import type { ActivityRuntime } from "../App";
import type { ActivityId } from "../types";
import { AlphabetActivity, AnimalsActivity, ColorsActivity, FeelingsActivity, FoodsActivity, NumbersActivity, ShapesActivity, VehiclesActivity } from "./ExploreActivities";
import { BodyActivity, BubbleActivity, DrawingActivity, FindActivity, KeyboardActivity, MatchingActivity, MemoryActivity, MusicActivity, SurpriseActivity } from "./GameActivities";
import { BigSmallActivity, CountFeedActivity, EverydayActivity, PatternTrainActivity, PuzzlesActivity, SortingActivity } from "./GrowingActivities";

export default function ActivitiesRouter({ activity, runtime }: { activity: ActivityId; runtime: ActivityRuntime }) {
  switch (activity) {
    case "colors": return <ColorsActivity runtime={runtime} />;
    case "shapes": return <ShapesActivity runtime={runtime} />;
    case "alphabet": return <AlphabetActivity runtime={runtime} />;
    case "numbers": return <NumbersActivity runtime={runtime} />;
    case "animals": return <AnimalsActivity runtime={runtime} />;
    case "foods": return <FoodsActivity runtime={runtime} />;
    case "vehicles": return <VehiclesActivity runtime={runtime} />;
    case "matching": return <MatchingActivity runtime={runtime} />;
    case "memory": return <MemoryActivity runtime={runtime} />;
    case "draw": return <DrawingActivity runtime={runtime} />;
    case "music": return <MusicActivity runtime={runtime} />;
    case "keyboard": return <KeyboardActivity runtime={runtime} />;
    case "bubbles": return <BubbleActivity runtime={runtime} />;
    case "find": return <FindActivity runtime={runtime} />;
    case "feelings": return <FeelingsActivity runtime={runtime} />;
    case "body": return <BodyActivity runtime={runtime} />;
    case "surprise": return <SurpriseActivity runtime={runtime} />;
    case "everyday": return <EverydayActivity runtime={runtime} />;
    case "sorting": return <SortingActivity runtime={runtime} />;
    case "count-feed": return <CountFeedActivity runtime={runtime} />;
    case "big-small": return <BigSmallActivity runtime={runtime} />;
    case "patterns": return <PatternTrainActivity runtime={runtime} />;
    case "puzzles": return <PuzzlesActivity runtime={runtime} />;
    default: return null;
  }
}
