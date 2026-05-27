// ============================================================================
// NFCC Digital Twin - ISO/IEC/NFPA Standards Compliance Data
// ============================================================================

import type { DivisionId } from '../types';

export interface ISOStandard {
  id: string;
  name: string;
  description: string;
  clauses: ISOClause[];
}

export interface ISOClause {
  clauseId: string;
  title: string;
  description: string;
  implemented: boolean;
  implementedBy: DivisionId[];
  featureDescription: string;
}

export const ISO_STANDARDS: ISOStandard[] = [
  {
    id: 'ISO-16484',
    name: 'ISO 16484',
    description: 'Building Automation and Control Systems (BACS)',
    clauses: [
      {
        clauseId: '16484-5',
        title: 'Data Communication Protocol',
        description: 'BACnet protocol for building automation data exchange',
        implemented: true,
        implementedBy: [4, 5, 6, 7],
        featureDescription:
          'BrokerWorker implements topic-based pub/sub mimicking BACnet object model with SensorNode properties',
      },
      {
        clauseId: '16484-3',
        title: 'Functions',
        description: 'Building automation functions and control strategies',
        implemented: true,
        implementedBy: [5],
        featureDescription:
          'HVAC division implements PID control loops with configurable Kp, Ki, Kd parameters',
      },
      {
        clauseId: '16484-6',
        title: 'Data Communication Conformance Testing',
        description: 'Testing of data communication conformance',
        implemented: true,
        implementedBy: [1],
        featureDescription:
          'Property-based tests validate BrokerWorker message routing correctness across all topics',
      },
    ],
  },
  {
    id: 'IEC-62443',
    name: 'IEC 62443',
    description: 'Industrial Automation and Control Systems Security',
    clauses: [
      {
        clauseId: '62443-3-3',
        title: 'System Security Requirements and Security Levels',
        description: 'Security requirements for control system components',
        implemented: true,
        implementedBy: [10],
        featureDescription:
          'CyberOps division visualizes network zones and conduits per IEC 62443 segmentation model',
      },
      {
        clauseId: '62443-2-1',
        title: 'Security Management System for IACS',
        description: 'Establishing an industrial automation security management system',
        implemented: true,
        implementedBy: [2, 10],
        featureDescription:
          'Internal Security and CyberOps divisions provide intrusion detection and unauthorized access monitoring',
      },
      {
        clauseId: '62443-4-2',
        title: 'Technical Security Requirements for IACS Components',
        description: 'Security capabilities for control system components',
        implemented: true,
        implementedBy: [10],
        featureDescription:
          'Threat counter and real-time alert system for unauthorized access attempts with source/target tracking',
      },
    ],
  },
  {
    id: 'ISO-27001',
    name: 'ISO 27001',
    description: 'Information Security Management Systems',
    clauses: [
      {
        clauseId: '27001-A.12',
        title: 'Operations Security',
        description: 'Operational procedures and responsibilities',
        implemented: true,
        implementedBy: [10, 2],
        featureDescription:
          'CyberOps terminal log and Internal Security intrusion log provide continuous operational monitoring',
      },
      {
        clauseId: '27001-A.16',
        title: 'Information Security Incident Management',
        description: 'Management of information security incidents and improvements',
        implemented: true,
        implementedBy: [1, 2],
        featureDescription:
          'Emergency State Machine with audit logging of all transition attempts (valid and invalid)',
      },
      {
        clauseId: '27001-A.9',
        title: 'Access Control',
        description: 'Business requirements of access control',
        implemented: true,
        implementedBy: [1, 2],
        featureDescription:
          'Override Control panel with division-level access control and LOCKDOWN door management',
      },
    ],
  },
  {
    id: 'NFPA-3000',
    name: 'NFPA 3000',
    description: 'Standard for an Active Shooter/Hostile Event Response (ASHER) Program',
    clauses: [
      {
        clauseId: '3000-7',
        title: 'Notification and Communication',
        description: 'Mass notification and crisis communication procedures',
        implemented: true,
        implementedBy: [11],
        featureDescription:
          'Crisis Communication division provides auto-drafted announcements and area-specific PA controls',
      },
      {
        clauseId: '3000-8',
        title: 'Evacuation and Shelter-in-Place',
        description: 'Evacuation procedures and route planning',
        implemented: true,
        implementedBy: [6],
        featureDescription:
          'A* pathfinding computes optimal evacuation routes visualized as glowing 3D lines',
      },
      {
        clauseId: '3000-5',
        title: 'Incident Management',
        description: 'Unified command and incident management structure',
        implemented: true,
        implementedBy: [1],
        featureDescription:
          'Command Center provides unified threat level gauge and Presidential Protocol for immediate lockdown',
      },
    ],
  },
  {
    id: 'ISO-19650',
    name: 'ISO 19650',
    description: 'Organization and Digitization of Information about Buildings (BIM)',
    clauses: [
      {
        clauseId: '19650-1',
        title: 'Concepts and Principles',
        description: 'Information management using BIM methodology',
        implemented: true,
        implementedBy: [1, 4, 5, 6, 7],
        featureDescription:
          'BIMMetadata interface stores vendor, install date, maintenance interval, and criticality per sensor node',
      },
      {
        clauseId: '19650-2',
        title: 'Delivery Phase of Assets',
        description: 'Information management during delivery phase',
        implemented: true,
        implementedBy: [9],
        featureDescription:
          'Logistics division tracks asset inventory with predictive maintenance scheduling',
      },
      {
        clauseId: '19650-3',
        title: 'Operational Phase of Assets',
        description: 'Information management during operational phase',
        implemented: true,
        implementedBy: [4, 5, 7],
        featureDescription:
          'Real-time sensor monitoring with IndexedDB time-series historian for operational data',
      },
    ],
  },
  {
    id: 'ISO-52120',
    name: 'ISO 52120',
    description: 'Energy Performance of Buildings - Contribution of Building Automation',
    clauses: [
      {
        clauseId: '52120-1',
        title: 'General Framework',
        description: 'Impact of building automation on energy performance',
        implemented: true,
        implementedBy: [4, 5],
        featureDescription:
          'Electrical load monitoring and HVAC PID control optimize energy consumption in real-time',
      },
      {
        clauseId: '52120-A',
        title: 'BAC Efficiency Classes',
        description: 'Classification of building automation efficiency',
        implemented: true,
        implementedBy: [5],
        featureDescription:
          'HVAC division demonstrates Class A automation with predictive control and zone-based management',
      },
      {
        clauseId: '52120-B',
        title: 'BAC Functions List',
        description: 'List of building automation and control functions',
        implemented: true,
        implementedBy: [4, 5, 6, 7],
        featureDescription:
          'Complete BAC function coverage: heating/cooling control, lighting, ventilation, and safety systems',
      },
    ],
  },
];
