import React from 'react';

export interface AcademicCampusSceneProps {
  className?: string;
}

export const AcademicCampusScene: React.FC<AcademicCampusSceneProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`w-full pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
      role="presentation"
      data-testid="academic-campus-scene"
    >
      <svg
        viewBox="0 0 640 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto text-blue-900/12 dark:text-blue-300/12 transition-opacity duration-300"
      >
        {/* Distant Campus Skyline / Study Hall Facade */}
        <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {/* Main Library Hall & Colonnade */}
          <rect x="180" y="55" width="220" height="95" rx="2" strokeDasharray="2 2" />
          <polygon points="170,55 290,20 410,55" />
          <line x1="290" y1="20" x2="290" y2="12" strokeWidth="1.5" />
          <circle cx="290" cy="10" r="2.5" />

          {/* Library Arches */}
          <path d="M200 150V90C200 80 215 80 215 90V150" />
          <path d="M230 150V90C230 80 245 80 245 90V150" />
          <path d="M260 150V85C260 72 280 72 280 85V150" />
          <path d="M295 150V85C295 72 315 72 315 85V150" />
          <path d="M330 150V90C330 80 345 80 345 90V150" />
          <path d="M360 150V90C360 80 375 80 375 90V150" />

          {/* Pediment Academic Rosette Motif */}
          <circle cx="290" cy="40" r="7" />
          <line x1="290" y1="33" x2="290" y2="47" strokeDasharray="1 2" />
          <line x1="283" y1="40" x2="297" y2="40" strokeDasharray="1 2" />

          {/* Left Wing — Computer & Sciences Institute */}
          <rect x="50" y="80" width="115" height="70" />
          <line x1="50" y1="100" x2="165" y2="100" />
          <line x1="50" y1="120" x2="165" y2="120" />
          <line x1="75" y1="80" x2="75" y2="150" />
          <line x1="105" y1="80" x2="105" y2="150" />
          <line x1="135" y1="80" x2="135" y2="150" />

          {/* Science Tower Accent */}
          <polygon points="105,80 105,45 125,45 125,80" />
          <line x1="115" y1="45" x2="115" y2="35" />
          <circle cx="115" cy="34" r="1.5" />

          {/* Right Wing — Humanities & Seminar Hall */}
          <rect x="415" y="75" width="135" height="75" />
          <line x1="415" y1="95" x2="550" y2="95" />
          <line x1="415" y1="115" x2="550" y2="115" />
          <line x1="440" y1="75" x2="440" y2="150" />
          <line x1="470" y1="75" x2="470" y2="150" />
          <line x1="500" y1="75" x2="500" y2="150" />
          <line x1="530" y1="75" x2="530" y2="150" />

          {/* Clock Tower Spire */}
          <rect x="425" y="40" width="26" height="35" />
          <polygon points="423,40 438,20 453,40" />
          <circle cx="438" cy="52" r="6" />
          <line x1="438" y1="52" x2="438" y2="48" />
          <line x1="438" y1="52" x2="442" y2="52" />
        </g>

        {/* Botanical Academic Trees & Landscaping */}
        <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          {/* Left Scholar Tree */}
          <path d="M35 150V120C25 110 15 118 20 105C25 90 45 92 48 100C55 88 70 95 65 110C60 120 45 125 35 120" />
          <line x1="35" y1="135" x2="42" y2="128" />

          {/* Center-Right Campus Tree */}
          <path d="M405 150V125C398 115 392 120 395 110C400 98 415 100 418 105C425 95 438 100 435 112C430 122 418 126 405 125" />

          {/* Far Right Garden Tree */}
          <path d="M570 150V118C560 108 550 115 555 102C562 88 580 90 585 98C592 88 605 92 602 105C598 115 585 120 570 118" />
        </g>

        {/* Campus Walkways & Study Plaza Ground Lines */}
        <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          {/* Ground Baseline */}
          <line x1="10" y1="150" x2="630" y2="150" strokeWidth="1.25" />

          {/* Perspective Plaza Lines converging to central library */}
          <line x1="285" y1="150" x2="250" y2="178" />
          <line x1="295" y1="150" x2="330" y2="178" />
          <line x1="210" y1="150" x2="150" y2="178" strokeDasharray="4 4" />
          <line x1="370" y1="150" x2="430" y2="178" strokeDasharray="4 4" />

          {/* Campus Lamp Post (Study Light) */}
          <line x1="175" y1="150" x2="175" y2="125" strokeWidth="1.5" />
          <path d="M172 125H178L176 120H174L172 125Z" />
          <circle cx="175" cy="122" r="1.5" fill="#F59E0B" fillOpacity="0.4" stroke="none" />
        </g>
      </svg>
    </div>
  );
};
