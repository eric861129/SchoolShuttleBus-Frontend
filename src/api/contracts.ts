export type UserRole = 'Student' | 'Parent' | 'Teacher' | 'Administrator'

export type StudentStage = 1 | 2 | 3 | 4
export type RouteType = 1 | 2
export type TripDirection = 1 | 2
export type AttendanceStatus = 1 | 2 | 3 | 4
export type BroadcastAudience = 1 | 2 | 3 | 4
export type ReportType = 1 | 2 | 3
export type ExportFormat = 1

export interface TokenResponse {
  userId: string
  email: string
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
}

export interface AccessibleStudentResponse {
  studentId: string
  studentNumber: string
  studentName: string
  stage: StudentStage
  gradeLabel: string
}

export interface StaffProfileSummaryResponse {
  staffProfileId: string
  employeeNumber: string
  fullName: string
  canManageAllRoutes: boolean
}

export interface CurrentUserContextResponse {
  userId: string
  email: string
  roles: UserRole[]
  displayName: string
  students: AccessibleStudentResponse[]
  staffProfile: StaffProfileSummaryResponse | null
}

export interface RegistrationDayResponse {
  date: string
  toSchool: boolean
  homebound: boolean
  toSchoolRouteId: string | null
  homeboundRouteId: string | null
}

export interface WeeklyRegistrationResponse {
  studentId: string
  studentName: string
  weekStart: string
  days: RegistrationDayResponse[]
}

export interface StudentRegistrationSummaryResponse {
  studentId: string
  studentName: string
  registeredTrips: number
  presentTrips: number
  stage: StudentStage
}

export interface RouteStopResponse {
  routeStopId: string
  sequence: number
  stopName: string
  address: string
  handoffContactName: string | null
  handoffContactPhone: string | null
}

export interface RouteAssignmentResponse {
  routeAssignmentId: string
  staffProfileId: string
  staffName: string
}

export interface RouteResponse {
  routeId: string
  routeName: string
  routeType: RouteType
  direction: TripDirection
  campusName: string
  isActive: boolean
  stops: RouteStopResponse[]
  assignments: RouteAssignmentResponse[]
}

export interface AttendanceRecordResponse {
  attendanceRecordId: string
  studentId: string
  studentName: string
  status: AttendanceStatus
  emergencyPhoneSnapshot: string | null
}

export interface AttendanceSessionResponse {
  attendanceSessionId: string
  routeId: string
  routeName: string
  date: string
  direction: TripDirection
  isCompleted: boolean
  records: AttendanceRecordResponse[]
}

export interface NotificationDeliveryResponse {
  notificationDeliveryId: string
  recipientEmail: string
  status: string
  sentAtUtc: string | null
  errorMessage: string | null
}

export interface ReminderRunResponse {
  notificationJobId: string
  deliveryCount: number
}

export interface AdminStudentLookupResponse {
  studentId: string
  studentNumber: string
  studentName: string
  stage: StudentStage
  gradeLabel: string
}

export interface AdminLookupsResponse {
  students: AdminStudentLookupResponse[]
  staffProfiles: StaffProfileSummaryResponse[]
}

export interface ReportExportResponse {
  reportExportId: string
  fileName: string
  contentType: string
  reportType: ReportType
  exportFormat: ExportFormat
  createdAtUtc: string
}

export const tripDirectionOptions = [
  { value: 1 as TripDirection, label: '去程' },
  { value: 2 as TripDirection, label: '回程' },
]

export const routeTypeOptions = [
  { value: 1 as RouteType, label: '固定班車' },
  { value: 2 as RouteType, label: '備援調度' },
]

export const attendanceStatusOptions = [
  { value: 1 as AttendanceStatus, label: '待確認' },
  { value: 2 as AttendanceStatus, label: '已上車' },
  { value: 3 as AttendanceStatus, label: '請假' },
  { value: 4 as AttendanceStatus, label: '缺席' },
]

export const broadcastAudienceOptions = [
  { value: 1 as BroadcastAudience, label: '全部' },
  { value: 2 as BroadcastAudience, label: '家長' },
  { value: 3 as BroadcastAudience, label: '學生' },
  { value: 4 as BroadcastAudience, label: '老師' },
]

export const reportTypeOptions = [
  { value: 1 as ReportType, label: '週乘車統計' },
  { value: 2 as ReportType, label: '點名結果報表' },
  { value: 3 as ReportType, label: '通知歷程報表' },
]

export const exportFormatOptions = [{ value: 1 as ExportFormat, label: 'CSV' }]

export const userRoleLabels: Record<UserRole, string> = {
  Student: '學生',
  Parent: '家長',
  Teacher: '老師',
  Administrator: '管理員',
}

export function formatUserRole(role: UserRole) {
  return userRoleLabels[role] || role
}

const notificationStatusLabels: Record<string, string> = {
  Pending: '待送出',
  Queued: '排程中',
  Processing: '處理中',
  Sent: '已送出',
  Delivered: '已送達',
  Success: '成功',
  Succeeded: '成功',
  Failed: '失敗',
  Error: '錯誤',
}

export function formatNotificationStatus(status: string) {
  return notificationStatusLabels[status] || status
}
