import type { RuleDefinition } from '../types'
import { contentRules } from './content'
import { geoRules } from './geo'
import { mobileRules } from './mobile'
import { performanceRules } from './performance'
import { securityRules } from './security'
import { socialAiRules } from './social-ai'
import { technicalRules } from './technical'

/** 전체 룰 레지스트리 (65개) */
export const ALL_RULES: RuleDefinition[] = [
  ...technicalRules,
  ...contentRules,
  ...socialAiRules,
  ...performanceRules,
  ...securityRules,
  ...mobileRules,
  ...geoRules,
]
