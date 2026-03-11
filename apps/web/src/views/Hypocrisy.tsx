import AboutGame from "@/sections/AboutGame";
import ArtMusic from "@/sections/ArtMusic";
import CallToAction from "@/sections/CallToAction";
import Characters from "@/sections/Characters";
import Gameplay from "@/sections/Gameplay";
import Hero from "@/sections/Hero";
import JoinUs from "@/sections/JoinUs";
import Roadmap from "@/sections/Roadmap";
import Team from "@/sections/Team";
import Universe from "@/sections/Universe";

export default function Hypocrisy() {
  return (
    <div>
      <Hero />
      <AboutGame />
      <Gameplay />
      <Universe />
      <Characters />
      <ArtMusic />
      <Roadmap />
      <Team />
      <JoinUs />
      <CallToAction />
    </div>
  );
}
