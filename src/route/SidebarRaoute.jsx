import { lazy } from "react";
import { 
  FaTachometerAlt, 
  FaUserPlus, 
  FaUsers, 
  FaRegClock, 
  FaPhoneSlash, 
  FaIdCard,
  FaBell
} from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const AddLead = lazy(() => import("../pages/AddLead"));
const Leads = lazy(() => import("../pages/Leads"));
const TodayReminders = lazy(() => import("../pages/TodayReminders"));
const MissedFollowups = lazy(() => import("../pages/MissedFollowups"));
const Profile = lazy(() => import("../pages/Profile"));
const Notifications = lazy(() => import("../pages/Notifications"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/add-lead", component: AddLead, name: "Add New Lead", icon: FaUserPlus },
  { path: "/leads", component: Leads, name: "Leads", icon: FaUsers },
  { path: "/today-reminders", component: TodayReminders, name: "Today's Reminders", icon: FaRegClock },
  { path: "/missed-followups", component: MissedFollowups, name: "Missed Follow-ups", icon: FaPhoneSlash },
  { path: "/notifications", component: Notifications, name: "Notifications", icon: FaBell },
  { path: "/profile", component: Profile, name: "My Profile", icon: FaIdCard },
];

export default routes;
