import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, CheckCircle } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <div className="w-20 h-20 rounded-3xl bg-green-500/10 backdrop-blur-md border border-green-500/20 flex items-center justify-center mx-auto mb-8">
              <Shield className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
              Politique de <span className="text-gradient">Confidentialité</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Votre vie privée est notre priorité absolue. Voici comment nous protégeons vos données.
            </p>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Collecte des Données</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Waler collecte uniquement les données nécessaires pour fournir notre service de suivi des relations. Nous utilisons les APIs officielles de Instagram pour accéder aux informations publiques de votre profil (liste d'abonnés, abonnements, statistiques). Nous ne collectons aucune donnée privée ou sensible au-delà de ce qui est nécessaire au fonctionnement du service.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Sécurité des Données</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Toutes vos données sont chiffrées using des standards bancaires (AES-256). Nous utilisons des serveurs sécurisés et suivons les meilleures pratiques de l'industrie pour protéger vos informations. Nos systèmes sont régulièrement audités pour garantir la sécurité maximale.
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Chiffrement de bout en bout
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Authentification sécurisée via OAuth
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Sauvegardes chiffrées quotidiennes
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Utilisation des Données</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Vos données sont utilisées exclusivement pour vous fournir le service Waler :
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Détecter les changements dans vos abonnements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Générer des analyses et statistiques
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Envoyer des notifications de suivi
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Engagement de Non-Commercialisation</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    <strong className="text-green-400">Vos données ne seront jamais utilisées à des fins commerciales ou revendues à des tiers.</strong>
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à aucune entreprise externe. Vos données restent strictement confidentielles et sont utilisées uniquement pour le fonctionnement de notre service. Nous ne partageons vos données qu'avec votre consentement explicite ou lorsque la loi l'exige.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Vos Droits</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Conformément au RGPD et aux lois sur la protection des données, vous avez les droits suivants :
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Accéder à vos données personnelles
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Demander la correction de vos données
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Demander la suppression de vos données
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Exporter vos données
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Révoquer votre consentement
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Pour toute question concernant notre politique de confidentialité ou l'utilisation de vos données, n'hésitez pas à nous contacter à :{' '}
                <a href="mailto:walerwebsite@outlook.com" className="text-green-400 hover:text-green-300 transition-colors">
                  walerwebsite@outlook.com
                </a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm text-gray-500 pt-8"
            >
              Dernière mise à jour : Avril 2024
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
