import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#3AB5E9] py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Frequently Asked Questions
              </h1>
              <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                Find answers to common questions about our teacher crowdfunding platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0E5D7F]">For Teachers</h2>
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: "How do I create a classroom project?",
                    answer:
                      "Creating a project is simple! After signing up, click 'Start a Project' on your dashboard. You'll be guided through a step-by-step process to describe your project, set a funding goal, add images, and explain how the resources will benefit your students.",
                  },
                  {
                    question: "What types of projects can I fund?",
                    answer:
                      "You can create projects for virtually any classroom need: books, technology, art supplies, scientific equipment, field trips, classroom furniture, or special learning materials. The key is to clearly explain how these resources will enhance your students' learning experience.",
                  },
                  {
                    question: "How long does funding take?",
                    answer:
                      "Project campaigns typically run for 30-60 days, but you can customize this timeframe. Once your project is fully funded, we'll process the funds and help you receive your materials within 2-3 weeks. If your project doesn't reach its funding goal, donors won't be charged.",
                  },
                  {
                    question: "Are there any fees for teachers?",
                    answer:
                      "BeyondMeasure is completely free for teachers to use. We cover our operating costs through optional donor tips and corporate partnerships, ensuring that as much money as possible goes directly to your classroom.",
                  },
                  {
                    question: "What makes a successful project?",
                    answer:
                      "Successful projects typically include compelling descriptions of how the materials will benefit students, clear photos, specific funding goals, and personal stories that connect donors to your classroom. Our project creation guide provides detailed tips for creating engaging campaigns.",
                  },
                  {
                    question: "What happens after my project is funded?",
                    answer:
                      "Once your project reaches its funding goal, we'll notify you and begin processing the funds. You'll receive the materials you requested, and we'll ask you to share photos and updates with your donors to show the impact of their contribution. This helps build community and encourages future support.",
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-[#0E5D7F]">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0E5D7F]">For Donors</h2>
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: "How do I know my donation makes an impact?",
                    answer:
                      "Transparency is core to our platform. Teachers share updates and photos showing how your donation has been used in their classroom. You'll receive email notifications when your funded projects post updates, allowing you to see the direct impact of your generosity on student learning.",
                  },
                  {
                    question: "Are my donations tax-deductible?",
                    answer:
                      "Yes! All donations made through our platform are tax-deductible. After making a donation, you'll receive a tax receipt via email that you can use for tax purposes.",
                  },
                  {
                    question: "Can I donate to specific schools or regions?",
                    answer:
                      "Absolutely. You can browse projects by location, subject area, grade level, or specific needs. This allows you to support schools in your community or focus on educational areas you're passionate about.",
                  },
                  {
                    question: "How much of my donation goes to the classroom?",
                    answer:
                      "We're proud that 95% of every donation goes directly to classroom projects. The remaining 5% helps us cover transaction fees, platform maintenance, and customer support to ensure both teachers and donors have a seamless experience.",
                  },
                  {
                    question: "Can I make a recurring donation?",
                    answer:
                      "Yes! You can set up monthly donations to continue supporting teachers throughout the year. You can choose to support specific teachers, schools, or let us direct your monthly contribution to high-need classrooms.",
                  },
                  {
                    question: "Can I donate as a business or organization?",
                    answer:
                      "Absolutely! We offer special programs for businesses and organizations, including matching gift opportunities, employee giving programs, and customized giving pages. Contact our partnerships team for more information.",
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index + 10}`}>
                    <AccordionTrigger className="text-left text-[#0E5D7F]">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0E5D7F]">Platform & Security</h2>
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: "Is my personal information secure?",
                    answer:
                      "Yes, we take security very seriously. We use industry-standard encryption and security protocols to protect your personal and financial information. We never sell user data to third parties.",
                  },
                  {
                    question: "How do you verify teachers and schools?",
                    answer:
                      "We have a thorough verification process to ensure all teacher accounts represent real educators at accredited schools. This includes checking school email addresses, professional credentials, and in some cases, direct communication with school administrators.",
                  },
                  {
                    question: "What payment methods do you accept?",
                    answer:
                      "We accept all major credit cards, PayPal, and Apple Pay. For larger corporate donations or grants, we can also arrange bank transfers or checks.",
                  },
                  {
                    question: "How can I get support if I have an issue?",
                    answer:
                      "Our support team is available via email and chat Monday through Friday, 9am-6pm EST. You can reach us anytime at support@beyondmeasure.org, and we typically respond within 24 hours.",
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index + 20}`}>
                    <AccordionTrigger className="text-left text-[#0E5D7F]">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="rounded-lg bg-[#F7DBA7]/20 p-6">
              <h3 className="text-lg font-semibold text-[#0E5D7F]">Still have questions?</h3>
              <p className="mt-2 text-muted-foreground">
                If you couldn't find the answer you were looking for, please reach out to our support team.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href="/contact"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-[#3AB5E9] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#3AB5E9]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Contact Support
                </a>
                <a
                  href="/resources"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Browse Resources
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
