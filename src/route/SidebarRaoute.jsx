import { lazy } from "react";
import { 
  FaTachometerAlt, 
  FaUserPlus, 
  FaUsers, 
  FaRegClock, 
  FaPhoneSlash, 
  FaIdCard,
  FaBell,
  FaCalendarAlt,
  FaUserTimes,
  FaFileAlt
} from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const AddLead = lazy(() => import("../pages/AddLead"));
const Leads = lazy(() => import("../pages/Leads"));
const TodayReminders = lazy(() => import("../pages/TodayReminders"));
const MissedFollowups = lazy(() => import("../pages/MissedFollowups"));
const RejectedLeads = lazy(() => import("../pages/RejectedLeads"));
const Profile = lazy(() => import("../pages/Profile"));
const Notifications = lazy(() => import("../pages/Notifications"));
const MeetingsCalendar = lazy(() => import("../pages/MeetingsCalendar"));
const LeadAssignmentReport = lazy(() => import("../pages/LeadAssignmentReport"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/add-lead", component: AddLead, name: "Add New Lead", icon: FaUserPlus },
  { path: "/leads", component: Leads, name: "Leads", icon: FaUsers },
  { path: "/notifications", component: Notifications, name: "Notifications", icon: FaBell },
  { path: "/reports", component: LeadAssignmentReport, name: "Lead Reports", icon: FaFileAlt },
  { path: "/profile", component: Profile, name: "My Profile", icon: FaIdCard },
];

export default routes;

