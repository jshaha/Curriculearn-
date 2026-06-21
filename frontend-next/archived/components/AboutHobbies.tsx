import type { HobbyGroup } from "@/content/hobbies";

interface AboutHobbiesProps {
  groups: HobbyGroup[];
}

export const AboutHobbies = ({ groups }: AboutHobbiesProps): JSX.Element => {
  return (
    <section className="max-w-[72ch] space-y-8 sm:space-y-9">
      <h2 className="text-[1.35rem] font-medium tracking-[-0.02em] text-fg sm:text-[1.48rem]">
        Outside of work
        <span className="text-accent">.</span>
      </h2>

      <div className="space-y-7 sm:space-y-8">
        {groups.map((group) => (
          <div key={group.label} className="space-y-3 sm:space-y-3.5">
            <h3 className="text-[0.98rem] font-medium tracking-[-0.01em] text-fg/86 sm:text-[1.02rem]">
              {group.label}
            </h3>
            <p className="text-[0.98rem] leading-[1.78] text-fg/68 sm:text-[1.02rem]">
              {group.items.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
