import TestimonialsSection from "@/components/TestimonialsSection";
import TestimonialsGrid from "@/components/TestimonialsGrid";
import FramedHero from "@/components/FramedHero";
import CourseExplorer from "@/components/CourseExplorer";
import Reveal from "@/components/Reveal";
import {
  fetchApprovedTestimonials,
  fetchHomeContent,
  type HomeContent,
  type Testimonial,
} from "@/lib/api";

// La page d'accueil dépend de contenu géré depuis l'admin (vidéo, témoignages
// approuvés) : on la rend dynamiquement pour qu'elle reflète toujours l'état
// le plus récent, au lieu d'être figée au moment du build.
export const dynamic = "force-dynamic";

// Témoignages d'exemple, affichés tant qu'aucun avis réel n'a été approuvé —
// pour que la section ne soit jamais vide au lancement.
const sampleTestimonials = [
  {
    quote:
      "Grâce à Kerryht Academy, j'ai appris le marketing digital en partant de zéro. Aujourd'hui je gère les réseaux sociaux de trois entreprises à Port-au-Prince.",
    name: "Nadège Étienne",
    designation: "Diplômée, formation Marketing Digital",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Les cours vidéo sont clairs et je pouvais avancer à mon rythme, entre mes cours à l'université et mon travail. Le certificat m'a aidé à décrocher mon premier stage.",
    name: "Jonas Pierre",
    designation: "Diplômé, formation Développement Web",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Une plateforme pensée pour nous : contenu en français, exemples concrets, et un accompagnement qui donne vraiment envie de terminer la formation jusqu'au bout.",
    name: "Stéphanie Louis",
    designation: "Diplômée, formation Design Graphique",
    src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Les quiz après chaque module m'ont vraiment aidé à retenir la matière. C'est la première formation en ligne que je termine du début à la fin.",
    name: "Wideline Joseph",
    designation: "Étudiante, formation Bureautique",
    src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export default async function HomePage() {
  let home: HomeContent = { hero_video: null, hero_poster: null };
  let approved: Testimonial[] = [];

  // Le rendu de l'accueil ne doit jamais casser si l'API est momentanément
  // indisponible : on retombe alors sur les valeurs par défaut.
  try {
    home = await fetchHomeContent();
  } catch {
    /* garde les valeurs par défaut */
  }
  try {
    approved = await fetchApprovedTestimonials();
  } catch {
    /* garde le tableau vide */
  }

  return (
    <main className="flex flex-1 flex-col">
      <FramedHero
        videoSrc={home.hero_video ?? undefined}
        posterSrc={home.hero_poster ?? undefined}
      />

      <section className="border-t border-white/5 px-6 py-20 lg:px-12">
        <CourseExplorer />
      </section>

      <section className="border-t border-white/5 px-6 py-20 lg:px-12">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Témoignages</p>
          <h2 className="mt-3 font-syne text-3xl font-bold text-white sm:text-4xl">
            Ce que disent nos étudiants
          </h2>
        </Reveal>
        {approved.length > 0 ? (
          <TestimonialsGrid testimonials={approved} />
        ) : (
          <TestimonialsSection testimonials={sampleTestimonials} />
        )}
      </section>
    </main>
  );
}
