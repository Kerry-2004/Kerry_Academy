import Navbar from "@/components/Navbar";
import CourseExplorer from "@/components/CourseExplorer";

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 py-20 lg:px-12">
        <CourseExplorer />
      </main>
    </>
  );
}
