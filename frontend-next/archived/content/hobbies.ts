export type HobbyGroup = {
  label: string;
  items: string[];
};

export const hobbyGroups: HobbyGroup[] = [
  {
    label: "Curiosity",
    items: ["reading", "reading news", "current events"]
  },
  {
    label: "Practice",
    items: ["chess", "piano", "sketching"]
  },
  {
    label: "Making & markets",
    items: ["cooking", "investing / stock trading"]
  }
];
