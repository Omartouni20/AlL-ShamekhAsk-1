export interface Request {
  id: string;
  customerPhone: string;
  message?: string;
  audioUrl?: string;
  audioDuration?: number;
  status: 'pending' | 'in-progress' | 'released';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  releaseScreenshot?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string;
  requestsCount: number;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Mock Data
export const mockEmployees: Employee[] = [
  { id: 'emp1', name: 'أحمد محمد', email: 'ahmed@company.com', password: '123456', requestsCount: 0 },
  { id: 'emp2', name: 'سارة علي', email: 'sara@company.com', password: '123456', requestsCount: 0 },
  { id: 'emp3', name: 'محمود حسن', email: 'mahmoud@company.com', password: '123456', requestsCount: 0 },
];

export const mockAdmin: Admin = {
  id: 'admin1',
  name: 'المدير العام',
  email: 'admin@company.com',
  password: 'admin123',
};

export const mockRequests: Request[] = [
  {
    id: 'req1',
    customerPhone: '+966501234567',
    message: 'أحتاج استفسار عن الخدمات المتاحة',
    status: 'pending',
    createdAt: new Date('2026-01-15T09:30:00'),
    updatedAt: new Date('2026-01-15T09:30:00'),
  },
  {
    id: 'req2',
    customerPhone: '+966509876543',
    message: 'لدي مشكلة في الطلب السابق',
    status: 'in-progress',
    assignedTo: 'emp1',
    assignedToName: 'أحمد محمد',
    createdAt: new Date('2026-01-15T10:15:00'),
    updatedAt: new Date('2026-01-15T10:20:00'),
  },
  {
    id: 'req3',
    customerPhone: '+966551234567',
    audioUrl: 'mock-audio-url',
    audioDuration: 45,
    status: 'in-progress',
    assignedTo: 'emp2',
    assignedToName: 'سارة علي',
    createdAt: new Date('2026-01-15T11:00:00'),
    updatedAt: new Date('2026-01-15T11:05:00'),
  },
  {
    id: 'req4',
    customerPhone: '+966507654321',
    message: 'شكراً على الخدمة الممتازة',
    status: 'released',
    assignedTo: 'emp1',
    assignedToName: 'أحمد محمد',
    releaseScreenshot: 'mock-screenshot-url',
    createdAt: new Date('2026-01-14T14:30:00'),
    updatedAt: new Date('2026-01-15T08:00:00'),
  },
  {
    id: 'req5',
    customerPhone: '+966558887777',
    message: 'متى يمكنني الحصول على الرد؟',
    status: 'released',
    assignedTo: 'emp2',
    assignedToName: 'سارة علي',
    releaseScreenshot: 'mock-screenshot-url',
    createdAt: new Date('2026-01-14T16:00:00'),
    updatedAt: new Date('2026-01-15T09:00:00'),
  },
];

// Update employee request counts
mockEmployees[0].requestsCount = mockRequests.filter(r => r.assignedTo === 'emp1').length;
mockEmployees[1].requestsCount = mockRequests.filter(r => r.assignedTo === 'emp2').length;
mockEmployees[2].requestsCount = mockRequests.filter(r => r.assignedTo === 'emp3').length;
