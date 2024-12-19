// src/services/tcfService.js
const { TCModel } = require('@iabtcf/core');
const axios = require('axios');

class TCFService {
   constructor() {
       this.TCF_VERSION = 2;
       this.CMP_ID = parseInt(process.env.IAB_CMP_ID) || 12;
       this.CMP_VERSION = 1;
       this.vendorList = null;
       this.loadVendorList();
   }

   async loadVendorList() {
       try {
           if (!this.vendorList) {
               const response = await axios.get('https://vendor-list.consensu.org/v2/vendor-list.json');
               this.vendorList = response.data;
               console.log('Vendor list loaded successfully');
           }
       } catch (error) {
           console.error('Error loading vendor list:', error);
           this.vendorList = {
               vendors: {},
               purposes: {},
               features: {}
           };
       }
   }

   async validateConsent(consentData) {
       try {
           // Validaciones básicas
           if (!consentData.domain) {
               return {
                   success: false,
                   errors: ['Domain is required']
               };
           }

           // Validar propósitos requeridos
           const requiredPurposes = [1]; // Propósito 1 es obligatorio
           for (const purpose of requiredPurposes) {
               if (!consentData[`purpose${purpose}_consent`]) {
                   return {
                       success: false,
                       errors: [`Purpose ${purpose} consent is required`]
                   };
               }
           }

           // Si hay vendors, validar sus propósitos
           if (consentData.vendors && consentData.vendors.length > 0) {
               const validVendors = await this.validateVendors(consentData.vendors);
               if (!validVendors.success) {
                   return validVendors;
               }
           }

           return {
               success: true,
               isValid: true
           };
       } catch (error) {
           return {
               success: false,
               errors: [error.message]
           };
       }
   }

   async createTCString(consentData) {
       try {
           const tcModel = new TCModel();

           // Configuración básica
           tcModel.cmpId = this.CMP_ID;
           tcModel.cmpVersion = this.CMP_VERSION;
           tcModel.isServiceSpecific = true;
           tcModel.useNonStandardStacks = false;
           tcModel.purposeOneTreatment = false;
           tcModel.publisherCountryCode = "ES";

           // Configurar propósitos
           let purposeConsents = new Set();
           for (let i = 1; i <= 10; i++) {
               if (consentData[`purpose${i}_consent`]) {
                   purposeConsents.add(i);
               }
           }
           tcModel.purposeConsents = purposeConsents;

           // Configurar vendors si existen
           if (consentData.vendors) {
               tcModel.vendorConsents = new Set(consentData.vendors);
           }

           // Timestamps
           tcModel.created = new Date();
           tcModel.lastUpdated = new Date();

           return {
               success: true,
               tcString: tcModel.encode()
           };
       } catch (error) {
           return {
               success: false,
               error: `Error creating TC string: ${error.message}`
           };
       }
   }

   async validateVendors(vendors) {
       try {
           await this.loadVendorList();
           
           if (!this.vendorList) {
               throw new Error('Vendor list not available');
           }

           for (const vendorId of vendors) {
               if (!this.vendorList.vendors[vendorId]) {
                   return {
                       success: false,
                       errors: [`Invalid vendor ID: ${vendorId}`]
                   };
               }
           }

           return {
               success: true
           };
       } catch (error) {
           return {
               success: false,
               errors: [error.message]
           };
       }
   }

   async checkGDPRApplicability(ip, domain) {
       try {
           // Lista de países de la UE + EEA
           const euCountries = [
               'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
               'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
               'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
               'IS', 'LI', 'NO', 'GB'
           ];

           // Dominios de la UE
           const euTlds = ['.eu', '.at', '.be', '.bg', '.hr', '.cy', '.cz', 
                          '.dk', '.ee', '.fi', '.fr', '.de', '.gr', '.hu', 
                          '.ie', '.it', '.lv', '.lt', '.lu', '.mt', '.nl', 
                          '.pl', '.pt', '.ro', '.sk', '.si', '.es', '.se'];

           // 1. Verificar dominio TLD
           const tld = domain ? '.' + domain.split('.').slice(-1)[0].toLowerCase() : '';
           if (euTlds.includes(tld)) {
               return {
                   applies: true,
                   reason: 'EU domain detected'
               };
           }

           // 2. Verificar IP
           if (ip) {
               try {
                   const response = await axios.get(`https://ipapi.co/${ip}/json/`);
                   const data = response.data;

                   if (euCountries.includes(data.country_code)) {
                       return {
                           applies: true,
                           reason: 'EU IP detected'
                       };
                   }
               } catch (error) {
                   console.error('Error checking IP:', error);
               }
           }

           // Por defecto, asumimos que aplica GDPR
           return {
               applies: true,
               reason: 'Default: GDPR compliance assumed'
           };

       } catch (error) {
           console.error('Error in GDPR applicability check:', error);
           return {
               applies: true,
               reason: 'Error during check - defaulting to GDPR compliance',
               error: error.message
           };
       }
   }

   decodeTCString(tcString) {
       try {
           const decoded = TCModel.decode(tcString);
           return {
               success: true,
               data: decoded
           };
       } catch (error) {
           return {
               success: false,
               error: `Error decoding TC string: ${error.message}`
           };
       }
   }

   getVendorList() {
       return this.vendorList;
   }
}

module.exports = new TCFService();