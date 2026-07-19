import React from "react";
import { Interview } from "../types";

interface InterviewCardProps {
  key?: string;
  interview: Interview;
  onSelect: () => void;
}

export default function InterviewCard({ interview, onSelect }: InterviewCardProps) {
  // Use the generated female and male images to mimic the exact layout of the screenshot
  const leftAvatarUrl = interview.coverImage || "/src/assets/images/female_founder_green_1784393420701.jpg";
  const rightAvatarUrl = "/src/assets/images/male_founder_yellow_1784393438114.jpg";

  // Format title to match high-end styled look
  const displayTitle = interview.title || (interview.startupName && interview.founderName
    ? `HOW WE BUILT ${interview.startupName.toUpperCase()}: ${interview.founderName}'s Story`
    : "Untitled Article");

  // Muted subtitle text matching the screenshot style
  const displaySubtitle = interview.subtitle || (interview.startupName
    ? `Detailed technical setup, distribution strategy, and unit economics behind ${interview.startupName} for readability like Substack.`
    : "");

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "3 days ago";
    }
  };
  const displayDate = interview.updatedAt || interview.createdAt ? formatDate(interview.updatedAt || interview.createdAt) : "3 days ago";

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-6 sm:gap-10 py-8 border-b border-gray-150 cursor-pointer group hover:bg-gray-50/40 px-3 sm:px-6 transition-colors rounded-2xl select-none"
      id={`interview-card-${interview.id}`}
    >
      {/* Left Circle: Female Founder Avatar (Green background) */}
      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/20 bg-emerald-50 relative">
        <img
          src={leftAvatarUrl}
          alt="Founder left avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Center Column: Text content */}
      <div className="flex-grow">
        <h3 className="font-sans font-extrabold text-base sm:text-[19px] text-gray-900 leading-snug mb-1.5 group-hover:text-emerald-700 transition-colors">
          {displayTitle}
        </h3>
        
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-2">
          {displaySubtitle}
        </p>

        {/* Founder & Time metadata */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="text-emerald-700">{interview.founderName}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">{displayDate}</span>
        </div>
      </div>

      {/* Right Circle: Male Founder Avatar (Yellow background) */}
      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-2 border-amber-400/20 bg-amber-50 relative">
        <img
          src={rightAvatarUrl}
          alt="Founder right avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}

