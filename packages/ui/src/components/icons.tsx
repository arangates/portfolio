import type { Icon as PhosphorIconComponent, IconProps } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { AppWindowIcon as BaseAppWindow } from "@phosphor-icons/react/dist/ssr/AppWindow";
import { ArchiveIcon as BaseArchiveIcon } from "@phosphor-icons/react/dist/ssr/Archive";
import { ArrowCounterClockwiseIcon as BaseRotateCcwIcon } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ArrowDownIcon as BaseArrowDownIcon } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { ArrowLeftIcon as BaseArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowRightIcon as BaseArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowSquareOutIcon as BaseExternalLinkIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { ArrowUpIcon as BaseArrowUpIcon } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import {
  ArrowUpRightIcon as BaseArrowUpRight,
  ArrowUpRightIcon as BaseArrowUpRightIcon,
} from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { ArrowsClockwiseIcon as BaseRefreshCwIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { ArrowsDownUpIcon as BaseArrowUpDownIcon } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp";
import {
  ArrowsLeftRightIcon as BaseArrowRightLeftIcon,
  ArrowsLeftRightIcon as BaseGitCompareArrowsIcon,
} from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
import { BankIcon as BaseLandmarkIcon } from "@phosphor-icons/react/dist/ssr/Bank";
import { BellIcon as BaseBellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { BellRingingIcon as BaseBellRing } from "@phosphor-icons/react/dist/ssr/BellRinging";
import { BellSlashIcon as BaseBellOffIcon } from "@phosphor-icons/react/dist/ssr/BellSlash";
import {
  BookOpenIcon as BaseBookOpen,
  BookOpenIcon as BaseBookOpenIcon,
} from "@phosphor-icons/react/dist/ssr/BookOpen";
import { BrainIcon as BaseBrainIcon } from "@phosphor-icons/react/dist/ssr/Brain";
import { BriefcaseIcon as BaseBriefcaseBusiness } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { BuildingIcon as BaseBuildingIcon } from "@phosphor-icons/react/dist/ssr/Building";
import { BuildingsIcon as BaseBuilding2Icon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { CalculatorIcon as BaseCalculatorIcon } from "@phosphor-icons/react/dist/ssr/Calculator";
import { CalendarCheckIcon as BaseCalendarCheckIcon } from "@phosphor-icons/react/dist/ssr/CalendarCheck";
import {
  CalendarDotsIcon as BaseCalendarClockIcon,
  CalendarDotsIcon as BaseCalendarDays,
  CalendarDotsIcon as BaseCalendarRangeIcon,
} from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { CarIcon as BaseCarFrontIcon } from "@phosphor-icons/react/dist/ssr/Car";
import { CaretDownIcon as BaseChevronDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretLeftIcon as BaseChevronLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon as BaseChevronRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretUpIcon as BaseChevronUpIcon } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { ChartLineIcon as BaseLineChartIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import {
  ChartLineUpIcon as BaseChartNoAxesCombined,
  ChartLineUpIcon as BaseChartNoAxesCombinedIcon,
} from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { ChartPieIcon as BaseChartPie } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { ChartPieSliceIcon as BasePieChartIcon } from "@phosphor-icons/react/dist/ssr/ChartPieSlice";
import { ChatCircleIcon as BaseMessageCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatCircle";
import { ChatCircleDotsIcon as BaseMessageCircleMore } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import {
  CheckIcon as BaseCheck,
  CheckIcon as BaseCheckIcon,
} from "@phosphor-icons/react/dist/ssr/Check";
import {
  CheckCircleIcon as BaseCheckCircle2Icon,
  CheckCircleIcon as BaseCircleCheckIcon,
} from "@phosphor-icons/react/dist/ssr/CheckCircle";
import {
  CircleNotchIcon as BaseLoader2,
  CircleNotchIcon as BaseLoader2Icon,
} from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { ClipboardTextIcon as BaseFileCheck2Icon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import {
  ClockCounterClockwiseIcon as BaseHistory,
  ClockCounterClockwiseIcon as BaseHistoryIcon,
} from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import {
  CodeIcon as BaseCode2,
  CodeIcon as BaseCode2Icon,
} from "@phosphor-icons/react/dist/ssr/Code";
import {
  CoinsIcon as BaseCoins,
  CoinsIcon as BaseCoinsIcon,
} from "@phosphor-icons/react/dist/ssr/Coins";
import { CopyIcon as BaseCopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
import { CurrencyCircleDollarIcon as BaseCircleDollarSignIcon } from "@phosphor-icons/react/dist/ssr/CurrencyCircleDollar";
import {
  CurrencyEurIcon as BaseBadgeEuroIcon,
  CurrencyEurIcon as BaseEuroIcon,
} from "@phosphor-icons/react/dist/ssr/CurrencyEur";
import { CurrencyInrIcon as BaseIndianRupeeIcon } from "@phosphor-icons/react/dist/ssr/CurrencyInr";
import {
  DatabaseIcon as BaseDatabase,
  DatabaseIcon as BaseDatabaseIcon,
  DatabaseIcon as BaseDatabaseZapIcon,
} from "@phosphor-icons/react/dist/ssr/Database";
import { DiamondIcon as BaseGemIcon } from "@phosphor-icons/react/dist/ssr/Diamond";
import { DotsThreeIcon as BaseMoreHorizontalIcon } from "@phosphor-icons/react/dist/ssr/DotsThree";
import { DotsThreeVerticalIcon as BaseEllipsisVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import {
  DownloadSimpleIcon as BaseArrowDownToLineIcon,
  DownloadSimpleIcon as BaseDownloadIcon,
} from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { EnvelopeIcon as BaseMail } from "@phosphor-icons/react/dist/ssr/Envelope";
import { EyeIcon as BaseEye, EyeIcon as BaseEyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon as BaseEyeOffIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import {
  FileTextIcon as BaseFileClock,
  FileTextIcon as BaseFileClockIcon,
  FileTextIcon as BaseFileTextIcon,
} from "@phosphor-icons/react/dist/ssr/FileText";
import { FileXlsIcon as BaseFileSpreadsheetIcon } from "@phosphor-icons/react/dist/ssr/FileXls";
import { FilesIcon as BaseFilesIcon } from "@phosphor-icons/react/dist/ssr/Files";
import { FingerprintIcon as BaseFingerprint } from "@phosphor-icons/react/dist/ssr/Fingerprint";
import {
  FlagIcon as BaseFlag,
  FlagIcon as BaseFlagIcon,
} from "@phosphor-icons/react/dist/ssr/Flag";
import { FlameIcon as BaseFlameIcon } from "@phosphor-icons/react/dist/ssr/Flame";
import { FlaskIcon as BaseFlaskIcon } from "@phosphor-icons/react/dist/ssr/Flask";
import { FloppyDiskIcon as BaseSaveIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { FolderPlusIcon as BaseFolderPlusIcon } from "@phosphor-icons/react/dist/ssr/FolderPlus";
import { FunnelIcon as BaseListFilterIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import {
  GaugeIcon as BaseCircleGaugeIcon,
  GaugeIcon as BaseGaugeIcon,
} from "@phosphor-icons/react/dist/ssr/Gauge";
import { GearIcon as BaseSettingsIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { GitBranchIcon as BaseGitBranch } from "@phosphor-icons/react/dist/ssr/GitBranch";
import {
  GlobeIcon as BaseGlobe2,
  GlobeIcon as BaseGlobe2Icon,
} from "@phosphor-icons/react/dist/ssr/Globe";
import { HandCoinsIcon as BaseHandCoinsIcon } from "@phosphor-icons/react/dist/ssr/HandCoins";
import { HardDrivesIcon as BaseServer } from "@phosphor-icons/react/dist/ssr/HardDrives";
import { HeadCircuitIcon as BaseBrainCircuitIcon } from "@phosphor-icons/react/dist/ssr/HeadCircuit";
import { HouseIcon as BaseHouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { InfoIcon as BaseInfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import {
  KeyIcon as BaseKeyRound,
  KeyIcon as BaseKeyRoundIcon,
} from "@phosphor-icons/react/dist/ssr/Key";
import { LaptopIcon as BaseLaptop } from "@phosphor-icons/react/dist/ssr/Laptop";
import { LightbulbIcon as BaseLightbulb } from "@phosphor-icons/react/dist/ssr/Lightbulb";
import { LinkIcon as BaseLinkIcon } from "@phosphor-icons/react/dist/ssr/Link";
import { ListIcon as BaseMenuIcon } from "@phosphor-icons/react/dist/ssr/List";
import { ListChecksIcon as BaseListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { LockKeyIcon as BaseLockKeyholeIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { MagnifyingGlassIcon as BaseSearchIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { MapTrifoldIcon as BaseMapIcon } from "@phosphor-icons/react/dist/ssr/MapTrifold";
import { MicrophoneIcon as BaseMicIcon } from "@phosphor-icons/react/dist/ssr/Microphone";
import {
  MoneyIcon as BaseBanknote,
  MoneyIcon as BaseBanknoteIcon,
} from "@phosphor-icons/react/dist/ssr/Money";
import { MoonIcon as BaseMoon } from "@phosphor-icons/react/dist/ssr/Moon";
import { PaperPlaneTiltIcon as BaseSendIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PaperclipIcon as BasePaperclipIcon } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { PathIcon as BaseRouteIcon } from "@phosphor-icons/react/dist/ssr/Path";
import { PauseIcon as BasePauseIcon } from "@phosphor-icons/react/dist/ssr/Pause";
import { PencilIcon as BasePencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { PencilLineIcon as BasePencilLineIcon } from "@phosphor-icons/react/dist/ssr/PencilLine";
import { PercentIcon as BasePercentIcon } from "@phosphor-icons/react/dist/ssr/Percent";
import { PiggyBankIcon as BasePiggyBankIcon } from "@phosphor-icons/react/dist/ssr/PiggyBank";
import { PlayIcon as BasePlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { PlusIcon as BasePlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ProhibitIcon as BaseOctagonXIcon } from "@phosphor-icons/react/dist/ssr/Prohibit";
import { ActivityIcon as BaseActivityIcon } from "@phosphor-icons/react/dist/ssr/Pulse";
import {
  QuestionIcon as BaseCircleHelp,
  QuestionIcon as BaseCircleHelpIcon,
} from "@phosphor-icons/react/dist/ssr/Question";
import {
  ReceiptIcon as BaseReceipt,
  ReceiptIcon as BaseReceiptTextIcon,
} from "@phosphor-icons/react/dist/ssr/Receipt";
import { RepeatIcon as BaseRepeat2Icon } from "@phosphor-icons/react/dist/ssr/Repeat";
import { RocketLaunchIcon as BaseRocket } from "@phosphor-icons/react/dist/ssr/RocketLaunch";
import { RulerIcon as BaseRulerIcon } from "@phosphor-icons/react/dist/ssr/Ruler";
import { ScalesIcon as BaseScaleIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import {
  SealCheckIcon as BaseBadgeCheck,
  SealCheckIcon as BaseBadgeCheckIcon,
} from "@phosphor-icons/react/dist/ssr/SealCheck";
import { SealQuestionIcon as BaseShieldQuestionIcon } from "@phosphor-icons/react/dist/ssr/SealQuestion";
import {
  ShieldCheckIcon as BaseShieldCheck,
  ShieldCheckIcon as BaseShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ShieldWarningIcon as BaseShieldAlertIcon } from "@phosphor-icons/react/dist/ssr/ShieldWarning";
import { ShoppingBagIcon as BaseShoppingBagIcon } from "@phosphor-icons/react/dist/ssr/ShoppingBag";
import { SidebarIcon as BasePanelLeftIcon } from "@phosphor-icons/react/dist/ssr/Sidebar";
import {
  SidebarSimpleIcon as BasePanelLeftCloseIcon,
  SidebarSimpleIcon as BasePanelLeftOpenIcon,
} from "@phosphor-icons/react/dist/ssr/SidebarSimple";
import { SignOutIcon as BaseLogOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import {
  SlidersHorizontalIcon as BaseSettings2Icon,
  SlidersHorizontalIcon as BaseSlidersHorizontal,
  SlidersHorizontalIcon as BaseSlidersHorizontalIcon,
} from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import {
  SparkleIcon as BaseSparkles,
  SparkleIcon as BaseSparklesIcon,
} from "@phosphor-icons/react/dist/ssr/Sparkle";
import { SquareIcon as BaseSquareIcon } from "@phosphor-icons/react/dist/ssr/Square";
import { SquaresFourIcon as BaseBlocksIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import {
  StackIcon as BaseBoxes,
  StackIcon as BaseLayers3,
  StackIcon as BaseLayers3Icon,
} from "@phosphor-icons/react/dist/ssr/Stack";
import { SunIcon as BaseSun } from "@phosphor-icons/react/dist/ssr/Sun";
import { TableIcon as BaseTableIcon } from "@phosphor-icons/react/dist/ssr/Table";
import { TargetIcon as BaseTargetIcon } from "@phosphor-icons/react/dist/ssr/Target";
import { TerminalIcon as BaseTerminal } from "@phosphor-icons/react/dist/ssr/Terminal";
import { TrashIcon as BaseTrash2Icon } from "@phosphor-icons/react/dist/ssr/Trash";
import { TrayIcon as BaseInboxIcon } from "@phosphor-icons/react/dist/ssr/Tray";
import { TrendUpIcon as BaseTrendingUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { UploadSimpleIcon as BaseUploadIcon } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { UserCircleIcon as BaseCircleUserRoundIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { UsersIcon as BaseUsersIcon } from "@phosphor-icons/react/dist/ssr/Users";
import { UsersThreeIcon as BaseUsersRound } from "@phosphor-icons/react/dist/ssr/UsersThree";
import {
  WalletIcon as BaseWallet,
  WalletIcon as BaseWalletCards,
  WalletIcon as BaseWalletCardsIcon,
  WalletIcon as BaseWalletIcon,
} from "@phosphor-icons/react/dist/ssr/Wallet";
import {
  WarningIcon as BaseAlertTriangleIcon,
  WarningIcon as BaseTriangleAlert,
  WarningIcon as BaseTriangleAlertIcon,
} from "@phosphor-icons/react/dist/ssr/Warning";
import { WarningCircleIcon as BaseAlertCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { WavesIcon as BaseWavesIcon } from "@phosphor-icons/react/dist/ssr/Waves";
import { WifiSlashIcon as BaseWifiOffIcon } from "@phosphor-icons/react/dist/ssr/WifiSlash";
import { XIcon as BaseXIcon } from "@phosphor-icons/react/dist/ssr/X";

export type PhosphorIcon = ComponentType<IconProps>;

function duotoneIcon(BaseIcon: PhosphorIconComponent): PhosphorIcon {
  return function DuotoneIcon(props: IconProps) {
    return <BaseIcon {...props} weight={props.weight ?? "duotone"} />;
  };
}

export const ActivityIcon = duotoneIcon(BaseActivityIcon);
export const AlertCircleIcon = duotoneIcon(BaseAlertCircleIcon);
export const AlertTriangleIcon = duotoneIcon(BaseAlertTriangleIcon);
export const AppWindow = duotoneIcon(BaseAppWindow);
export const ArchiveIcon = duotoneIcon(BaseArchiveIcon);
export const ArrowDownIcon = duotoneIcon(BaseArrowDownIcon);
export const ArrowDownToLineIcon = duotoneIcon(BaseArrowDownToLineIcon);
export const ArrowLeftIcon = duotoneIcon(BaseArrowLeftIcon);
export const ArrowRightIcon = duotoneIcon(BaseArrowRightIcon);
export const ArrowRightLeftIcon = duotoneIcon(BaseArrowRightLeftIcon);
export const ArrowUpDownIcon = duotoneIcon(BaseArrowUpDownIcon);
export const ArrowsDownUpIcon = ArrowUpDownIcon;
export const ArrowUpIcon = duotoneIcon(BaseArrowUpIcon);
export const ArrowUpRight = duotoneIcon(BaseArrowUpRight);
export const ArrowUpRightIcon = duotoneIcon(BaseArrowUpRightIcon);
export const BadgeCheck = duotoneIcon(BaseBadgeCheck);
export const BadgeCheckIcon = duotoneIcon(BaseBadgeCheckIcon);
export const BadgeEuroIcon = duotoneIcon(BaseBadgeEuroIcon);
export const Banknote = duotoneIcon(BaseBanknote);
export const BanknoteIcon = duotoneIcon(BaseBanknoteIcon);
export const BellIcon = duotoneIcon(BaseBellIcon);
export const BellOffIcon = duotoneIcon(BaseBellOffIcon);
export const BellRing = duotoneIcon(BaseBellRing);
export const BlocksIcon = duotoneIcon(BaseBlocksIcon);
export const BookOpen = duotoneIcon(BaseBookOpen);
export const BookOpenIcon = duotoneIcon(BaseBookOpenIcon);
export const Boxes = duotoneIcon(BaseBoxes);
export const BrainCircuitIcon = duotoneIcon(BaseBrainCircuitIcon);
export const BrainIcon = duotoneIcon(BaseBrainIcon);
export const BriefcaseBusiness = duotoneIcon(BaseBriefcaseBusiness);
export const Building2Icon = duotoneIcon(BaseBuilding2Icon);
export const BuildingIcon = duotoneIcon(BaseBuildingIcon);
export const CalculatorIcon = duotoneIcon(BaseCalculatorIcon);
export const CalendarCheckIcon = duotoneIcon(BaseCalendarCheckIcon);
export const CalendarClockIcon = duotoneIcon(BaseCalendarClockIcon);
export const CalendarDays = duotoneIcon(BaseCalendarDays);
export const CalendarRangeIcon = duotoneIcon(BaseCalendarRangeIcon);
export const CarFrontIcon = duotoneIcon(BaseCarFrontIcon);
export const ChartNoAxesCombined = duotoneIcon(BaseChartNoAxesCombined);
export const ChartNoAxesCombinedIcon = duotoneIcon(BaseChartNoAxesCombinedIcon);
export const ChartPie = duotoneIcon(BaseChartPie);
export const Check = duotoneIcon(BaseCheck);
export const CheckCircle2Icon = duotoneIcon(BaseCheckCircle2Icon);
export const CheckIcon = duotoneIcon(BaseCheckIcon);
export const ChevronDownIcon = duotoneIcon(BaseChevronDownIcon);
export const ChevronLeftIcon = duotoneIcon(BaseChevronLeftIcon);
export const ChevronRightIcon = duotoneIcon(BaseChevronRightIcon);
export const ChevronUpIcon = duotoneIcon(BaseChevronUpIcon);
export const CircleCheckIcon = duotoneIcon(BaseCircleCheckIcon);
export const CircleDollarSignIcon = duotoneIcon(BaseCircleDollarSignIcon);
export const CircleGaugeIcon = duotoneIcon(BaseCircleGaugeIcon);
export const CircleHelp = duotoneIcon(BaseCircleHelp);
export const CircleHelpIcon = duotoneIcon(BaseCircleHelpIcon);
export const CircleUserRoundIcon = duotoneIcon(BaseCircleUserRoundIcon);
export const Code2 = duotoneIcon(BaseCode2);
export const Code2Icon = duotoneIcon(BaseCode2Icon);
export const Coins = duotoneIcon(BaseCoins);
export const CoinsIcon = duotoneIcon(BaseCoinsIcon);
export const CopyIcon = duotoneIcon(BaseCopyIcon);
export const Database = duotoneIcon(BaseDatabase);
export const DatabaseIcon = duotoneIcon(BaseDatabaseIcon);
export const DatabaseZapIcon = duotoneIcon(BaseDatabaseZapIcon);
export const DownloadIcon = duotoneIcon(BaseDownloadIcon);
export const EllipsisVerticalIcon = duotoneIcon(BaseEllipsisVerticalIcon);
export const EuroIcon = duotoneIcon(BaseEuroIcon);
export const ExternalLinkIcon = duotoneIcon(BaseExternalLinkIcon);
export const Eye = duotoneIcon(BaseEye);
export const EyeIcon = duotoneIcon(BaseEyeIcon);
export const EyeOffIcon = duotoneIcon(BaseEyeOffIcon);
export const FileCheck2Icon = duotoneIcon(BaseFileCheck2Icon);
export const FileClock = duotoneIcon(BaseFileClock);
export const FileClockIcon = duotoneIcon(BaseFileClockIcon);
export const FileSpreadsheetIcon = duotoneIcon(BaseFileSpreadsheetIcon);
export const FileTextIcon = duotoneIcon(BaseFileTextIcon);
export const FilesIcon = duotoneIcon(BaseFilesIcon);
export const Fingerprint = duotoneIcon(BaseFingerprint);
export const Flag = duotoneIcon(BaseFlag);
export const FlagIcon = duotoneIcon(BaseFlagIcon);
export const FlameIcon = duotoneIcon(BaseFlameIcon);
export const FlaskIcon = duotoneIcon(BaseFlaskIcon);
export const FolderPlusIcon = duotoneIcon(BaseFolderPlusIcon);
export const GaugeIcon = duotoneIcon(BaseGaugeIcon);
export const GemIcon = duotoneIcon(BaseGemIcon);
export const GitBranch = duotoneIcon(BaseGitBranch);
export const GitCompareArrowsIcon = duotoneIcon(BaseGitCompareArrowsIcon);
export const Globe2 = duotoneIcon(BaseGlobe2);
export const Globe2Icon = duotoneIcon(BaseGlobe2Icon);
export const HandCoinsIcon = duotoneIcon(BaseHandCoinsIcon);
export const History = duotoneIcon(BaseHistory);
export const HistoryIcon = duotoneIcon(BaseHistoryIcon);
export const HouseIcon = duotoneIcon(BaseHouseIcon);
export const InboxIcon = duotoneIcon(BaseInboxIcon);
export const IndianRupeeIcon = duotoneIcon(BaseIndianRupeeIcon);
export const InfoIcon = duotoneIcon(BaseInfoIcon);
export const KeyRound = duotoneIcon(BaseKeyRound);
export const KeyRoundIcon = duotoneIcon(BaseKeyRoundIcon);
export const LandmarkIcon = duotoneIcon(BaseLandmarkIcon);
export const Laptop = duotoneIcon(BaseLaptop);
export const Layers3 = duotoneIcon(BaseLayers3);
export const Layers3Icon = duotoneIcon(BaseLayers3Icon);
export const Lightbulb = duotoneIcon(BaseLightbulb);
export const LineChartIcon = duotoneIcon(BaseLineChartIcon);
export const LinkIcon = duotoneIcon(BaseLinkIcon);
export const ListChecksIcon = duotoneIcon(BaseListChecksIcon);
export const ListFilterIcon = duotoneIcon(BaseListFilterIcon);
export const Loader2 = duotoneIcon(BaseLoader2);
export const Loader2Icon = duotoneIcon(BaseLoader2Icon);
export const LockKeyholeIcon = duotoneIcon(BaseLockKeyholeIcon);
export const LogOutIcon = duotoneIcon(BaseLogOutIcon);
export const Mail = duotoneIcon(BaseMail);
export const MapIcon = duotoneIcon(BaseMapIcon);
export const MenuIcon = duotoneIcon(BaseMenuIcon);
export const MessageCircleIcon = duotoneIcon(BaseMessageCircleIcon);
export const MessageCircleMore = duotoneIcon(BaseMessageCircleMore);
export const MicIcon = duotoneIcon(BaseMicIcon);
export const Moon = duotoneIcon(BaseMoon);
export const MoreHorizontalIcon = duotoneIcon(BaseMoreHorizontalIcon);
export const OctagonXIcon = duotoneIcon(BaseOctagonXIcon);
export const PanelLeftCloseIcon = duotoneIcon(BasePanelLeftCloseIcon);
export const PanelLeftIcon = duotoneIcon(BasePanelLeftIcon);
export const PanelLeftOpenIcon = duotoneIcon(BasePanelLeftOpenIcon);
export const PaperclipIcon = duotoneIcon(BasePaperclipIcon);
export const PauseIcon = duotoneIcon(BasePauseIcon);
export const PencilIcon = duotoneIcon(BasePencilIcon);
export const PencilLineIcon = duotoneIcon(BasePencilLineIcon);
export const PercentIcon = duotoneIcon(BasePercentIcon);
export const PieChartIcon = duotoneIcon(BasePieChartIcon);
export const PiggyBankIcon = duotoneIcon(BasePiggyBankIcon);
export const PlayIcon = duotoneIcon(BasePlayIcon);
export const PlusIcon = duotoneIcon(BasePlusIcon);
export const Receipt = duotoneIcon(BaseReceipt);
export const ReceiptTextIcon = duotoneIcon(BaseReceiptTextIcon);
export const RefreshCwIcon = duotoneIcon(BaseRefreshCwIcon);
export const Repeat2Icon = duotoneIcon(BaseRepeat2Icon);
export const Rocket = duotoneIcon(BaseRocket);
export const RotateCcwIcon = duotoneIcon(BaseRotateCcwIcon);
export const RouteIcon = duotoneIcon(BaseRouteIcon);
export const RulerIcon = duotoneIcon(BaseRulerIcon);
export const SaveIcon = duotoneIcon(BaseSaveIcon);
export const ScaleIcon = duotoneIcon(BaseScaleIcon);
export const SearchIcon = duotoneIcon(BaseSearchIcon);
export const SendIcon = duotoneIcon(BaseSendIcon);
export const Server = duotoneIcon(BaseServer);
export const Settings2Icon = duotoneIcon(BaseSettings2Icon);
export const SettingsIcon = duotoneIcon(BaseSettingsIcon);
export const ShieldAlertIcon = duotoneIcon(BaseShieldAlertIcon);
export const ShieldCheck = duotoneIcon(BaseShieldCheck);
export const ShieldCheckIcon = duotoneIcon(BaseShieldCheckIcon);
export const ShieldQuestionIcon = duotoneIcon(BaseShieldQuestionIcon);
export const ShoppingBagIcon = duotoneIcon(BaseShoppingBagIcon);
export const SlidersHorizontal = duotoneIcon(BaseSlidersHorizontal);
export const SlidersHorizontalIcon = duotoneIcon(BaseSlidersHorizontalIcon);
export const Sparkles = duotoneIcon(BaseSparkles);
export const SparklesIcon = duotoneIcon(BaseSparklesIcon);
export const SquareIcon = duotoneIcon(BaseSquareIcon);
export const Sun = duotoneIcon(BaseSun);
export const TableIcon = duotoneIcon(BaseTableIcon);
export const TargetIcon = duotoneIcon(BaseTargetIcon);
export const Terminal = duotoneIcon(BaseTerminal);
export const Trash2Icon = duotoneIcon(BaseTrash2Icon);
export const TrendingUpIcon = duotoneIcon(BaseTrendingUpIcon);
export const TriangleAlert = duotoneIcon(BaseTriangleAlert);
export const TriangleAlertIcon = duotoneIcon(BaseTriangleAlertIcon);
export const UploadIcon = duotoneIcon(BaseUploadIcon);
export const UsersIcon = duotoneIcon(BaseUsersIcon);
export const UsersRound = duotoneIcon(BaseUsersRound);
export const Wallet = duotoneIcon(BaseWallet);
export const WalletCards = duotoneIcon(BaseWalletCards);
export const WalletCardsIcon = duotoneIcon(BaseWalletCardsIcon);
export const WalletIcon = duotoneIcon(BaseWalletIcon);
export const WavesIcon = duotoneIcon(BaseWavesIcon);
export const WifiOffIcon = duotoneIcon(BaseWifiOffIcon);
export const XIcon = duotoneIcon(BaseXIcon);
