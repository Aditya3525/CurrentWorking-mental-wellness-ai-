# Taxonomy Combinations

This folder contains exhaustive, search-friendly combinations for content and practices.

- content_combinations.csv: category x content_type x approach (3 x 4 x 23 = 276 rows + header)
- practice_combinations.csv: category x practice_type x approach (4 x 10 x 23 = 920 rows + header)

Columns:
- category: canonical slug (kebab-case)
- content_type | practice_type: modality
- approach: western | eastern | hybrid (content) and western | eastern | hybrid | all (practice)
- tags: comma-separated canonical and synonym tokens (useful for DB tagging and fuzzy search)
- search_key: simple concatenation for local search indexing

Categories include: anxiety, depression, stress, overthinking, emotional-intelligence, trauma, personality, sleep, burnout, fatigue, focus, mood, anger, relaxation, grounding, self-compassion, resilience, relationships, self-esteem, grief, panic, social-anxiety, overall-wellbeing
