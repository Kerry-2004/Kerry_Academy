"use client";

import dynamic from "next/dynamic";

const AnimatedTestimonials = dynamic(
  () => import("@/components/ui/animated-testimonials").then((mod) => mod.AnimatedTestimonials),
  { ssr: false },
);

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return <AnimatedTestimonials testimonials={testimonials} autoplay />;
}
