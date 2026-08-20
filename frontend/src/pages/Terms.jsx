import { motion } from "framer-motion";
import { ShieldCheck, Lock, FileText, Scale } from "lucide-react";

export default function Terms() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const sections = [
    {
      icon: <FileText size={20} className="text-nest-terra" />,
      title: "1. Room Rental Terms & Agreements",
      content: "All room rentals brokered through Nest Services require a digitally signed lease agreement. The standard lease period is 11 months unless explicitly stated otherwise. Tenants must adhere to the community guidelines set forth by the landlord, which are attached as an addendum to every lease."
    },
    {
      icon: <Lock size={20} className="text-nest-terra" />,
      title: "2. Security Deposits & Payments",
      content: "Security deposits equal to one month's rent (unless specified differently by the owner) are held in a secure escrow account until the termination of the lease. All rent payments must be processed securely through the Nest Resident Portal to guarantee payment trails and prevent fraud."
    },
    {
      icon: <ShieldCheck size={20} className="text-nest-terra" />,
      title: "3. Trust & Identity Verification",
      content: "To maintain a high standard of trust within the Nest network, both tenants and landlords undergo mandatory KYC identity verification (Aadhaar/PAN for Indian residents). Background checks may be performed where applicable before finalizing any long-term rental contract."
    },
    {
      icon: <Scale size={20} className="text-nest-terra" />,
      title: "4. Dispute Resolution",
      content: "Nest Services acts solely as a discovery and management platform. In the event of a dispute regarding damages, deductions, or lease violations, both parties agree to first engage in good-faith mediation facilitated by the platform before seeking formal legal arbitration."
    }
  ];

  return (
    <main className="bg-nest-ink text-white min-h-screen pt-32 pb-24">
      <div className="container-nest max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariant}>
          <div className="kicker text-nest-stone before:bg-nest-stone">Legal & Trust Center</div>
          <h1 className="headline-md mt-6">Transparent terms for a trusted community.</h1>
          <p className="text-body mt-6 text-lg max-w-2xl">
            We believe that clear rules create better relationships. Read through our core terms and conditions for renting through Nest Services.
          </p>
        </motion.div>

        <div className="mt-16 space-y-8">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUpVariant}
              className="glass-card p-8 md:p-10"
            >
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl grid place-items-center mb-6">
                {section.icon}
              </div>
              <h2 className="font-display text-[22px] text-white">{section.title}</h2>
              <p className="text-body mt-4 text-[15px] leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 text-body text-[13px]">
          <p>Last updated: August 2026. These terms govern the use of the platform. For full exhaustive legal policies including Privacy and Cookie usage, please contact our legal team.</p>
        </div>
      </div>
    </main>
  );
}
