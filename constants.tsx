
import React from 'react';
import { LayoutDashboard, ReceiptText, Users, MessageSquare, Settings, UserCircle } from 'lucide-react';

export const APP_NAME = "InvoTrack";

export const COLORS = {
  primary: "#4F46E5",
  secondary: "#10B981",
  accent: "#F59E0B",
  danger: "#EF4444"
};

export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SG9ds8EFCosEt2S4fnX7iyscGLRM8Txug8xo3tgeXJ1FGTXflpZVsCCgUlr8TEjnslXxgtq2Q46so1L8Alvr23B00xaHskFAt';
// Service categories with detailed descriptions for invoices
export const SERVICE_CATEGORIES = [
  { label: 'Content Writing', description: 'Professional content creation services including blog posts, articles, website copy, marketing materials, and SEO-optimized content tailored to engage your target audience and drive conversions.' },
  { label: 'Portfolio Design', description: 'Custom portfolio website design and development to showcase your work professionally with modern layouts, responsive design, and optimized user experience for potential clients and employers.' },
  { label: 'Digital Marketing', description: 'Comprehensive digital marketing strategy encompassing SEO, SEM, social media marketing, content marketing, email campaigns, and analytics to maximize your online presence and ROI.' },
  { label: 'Web Development', description: 'Full-stack web development services including frontend and backend development, database design, API integration, responsive design, and deployment for modern, scalable web applications.' },
  { label: 'Logo Design', description: 'Creative logo design and brand identity development including multiple concept variations, color palette selection, typography, and complete brand guidelines for consistent brand representation.' },
  { label: 'UI/UX Design', description: 'User interface and experience design for web and mobile applications including wireframing, prototyping, user research, usability testing, and interactive design systems for optimal user engagement.' },
  { label: 'Video Editing', description: 'Professional video editing services including color correction, motion graphics, sound design, transitions, effects, and post-production for promotional videos, social media content, and corporate presentations.' },
  { label: 'Social Media Management', description: 'Complete social media strategy and management including content creation, scheduling, community engagement, analytics reporting, influencer outreach, and paid advertising campaign management.' },
  { label: 'SEO Services', description: 'Search engine optimization services including technical SEO audit, keyword research, on-page optimization, link building, content strategy, and monthly performance reporting to improve search rankings.' },
  { label: 'Graphic Design', description: 'Custom graphic design services for print and digital media including brochures, flyers, banners, social media graphics, infographics, and marketing collateral with unlimited revisions.' },
  { label: 'App Development', description: 'Native and cross-platform mobile application development for iOS and Android including UI design, backend integration, push notifications, app store optimization, and ongoing maintenance support.' },
  { label: 'Consulting', description: 'Professional business and technology consulting services including strategic planning, process optimization, digital transformation, and actionable recommendations to achieve your business objectives.' },
  { label: 'Photography', description: 'Professional photography services including event coverage, corporate headshots, product photography, lifestyle shoots, and post-processing with high-resolution deliverables and commercial usage rights.' },
  { label: 'Brand Strategy', description: 'Comprehensive brand strategy and positioning services including market research, competitor analysis, brand messaging, visual identity development, and go-to-market strategy for business growth.' },
  { label: 'Email Marketing', description: 'Email marketing services including campaign design, automation workflows, A/B testing, list segmentation, deliverability optimization, and detailed analytics reporting to maximize engagement and conversions.' },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  { label: 'Invoices', icon: <ReceiptText size={20} />, path: 'invoices' },
  { label: 'Profiles', icon: <UserCircle size={20} />, path: 'profiles', memberOnly: true },
  { label: 'Members', icon: <Users size={20} />, path: 'members', adminOnly: true },
];

