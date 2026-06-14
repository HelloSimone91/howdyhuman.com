import html
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / 'Values-en.json'
SITE_URL = 'https://www.howdyhuman.com'
EXPANDED_VALUE_SLUGS = {
    'courage',
    'integrity',
    'compassion',
    'clarity',
    'self-awareness',
    'love',
    'forgiveness',
    'trust',
    'purpose',
    'community',
    'resilience',
    'kindness',
    'honesty',
    'responsibility',
    'willingness',
}

CATEGORY_LENSES = {
    'Aspirations': [
        'As an aspiration, it gives direction to choices that would otherwise drift.',
        'This kind of value points attention toward a future someone is willing to help build.',
        'It works best when it becomes a practical orientation, not a distant ideal.',
    ],
    'Core Values': [
        'As a core value, it works like an inner standard for repeated choices.',
        'It helps define what kind of person, team, or community someone is becoming.',
        'It usually matters most when a shortcut would be easier than the stated standard.',
    ],
    'Growth': [
        'As a growth value, it asks for practice rather than performance.',
        'It becomes visible through adjustment, repetition, and honest feedback.',
        'It belongs to the moments where trying again matters more than already being good.',
    ],
    'Interpersonal': [
        'As an interpersonal value, it shapes the space between people.',
        'It affects trust, conflict, repair, and the way people leave an exchange.',
        'It becomes real in the quality of attention someone brings to another person.',
    ],
    'Mindset': [
        'As a mindset value, it changes how pressure, choice, and uncertainty are interpreted.',
        'It turns a private way of seeing into a visible way of acting.',
        'It often appears before the outward action, in the story someone chooses to believe.',
    ],
    'Personal': [
        'As a personal value, it steadies the relationship between intention and behavior.',
        'It helps private preference become an observable pattern.',
        'It shows up in ordinary moments where nobody else may be keeping score.',
    ],
    'Social': [
        'As a social value, it reaches beyond individual preference.',
        'It asks how choices affect a wider group and the systems people share.',
        'It becomes visible when dignity, care, or participation has to be protected in public.',
    ],
    'Uncategorized': [
        'As a value, it becomes meaningful when it moves from an idea into a repeated action.',
        'The point is not to admire the word, but to notice what it asks a person to do.',
        'It matters most when the abstract word has to guide a specific choice.',
    ],
}

CATEGORY_CONTEXTS = {
    'Aspirations': {
        'scene': 'when someone is deciding what future they are willing to build',
        'pressure': 'short-term comfort',
        'practice': 'future-facing choice',
    },
    'Core Values': {
        'scene': 'when a shortcut would be easier than the standard someone claims to hold',
        'pressure': 'convenience',
        'practice': 'standard-setting choice',
    },
    'Growth': {
        'scene': 'while someone is learning, revising, or trying again after feedback',
        'pressure': 'the wish to already be good at it',
        'practice': 'learning choice',
    },
    'Interpersonal': {
        'scene': 'inside a conversation where another person has something at stake',
        'pressure': 'defensiveness',
        'practice': 'relational choice',
    },
    'Mindset': {
        'scene': 'under pressure, before the first reaction hardens into the whole story',
        'pressure': 'old interpretation',
        'practice': 'attention-shaping choice',
    },
    'Personal': {
        'scene': 'in an ordinary routine where nobody else may notice the decision',
        'pressure': 'autopilot',
        'practice': 'self-directed choice',
    },
    'Social': {
        'scene': 'in a group decision where the outcome affects more than one person',
        'pressure': 'individual preference',
        'practice': 'community-facing choice',
    },
    'Uncategorized': {
        'scene': 'in a real situation where the word needs to become behavior',
        'pressure': 'abstraction',
        'practice': 'values-based choice',
    },
}

EXPANDED_VALUE_CONTENT = {
    'courage': {
        'why': (
            'Courage matters because values become real at the point where comfort runs out. It is not the absence '
            'of fear; it is the moment someone can face what is happening without abandoning what matters. Courage '
            'may look like speaking in a tense room, defending someone who has less power, or standing by a boundary '
            'after the old pattern asks you to smooth it over. Howdy Human treats courage as a verb before it is a '
            'personality trait: face, confront, stand, speak, defend. The brave move is usually smaller than the '
            'fantasy of bravery, and much more useful.'
        ),
        'examples': [
            'At work, courage might mean telling a supervisor that the launch plan is unsafe, even though everyone is tired and wants the meeting to be over.',
            'In a relationship, courage can look like saying, "I want to stay connected, but I cannot pretend that did not hurt," and then staying present for the reply.',
            'In personal growth, courage may be choosing the first visible attempt after a long season of preparing privately.',
        ],
        'practice': [
            'Name the specific fear in one sentence: "I am afraid that if I speak, ____."',
            'Choose one small thing to face today: a question, a boundary, a repair, or a first attempt.',
            'Say the true thing plainly before you add explanations to make it safer.',
            'Ask what you are trying to defend: your dignity, someone else, a commitment, or the future version of you.',
            'Notice where avoidance has started calling itself wisdom, then test that story with one honest action.',
        ],
        'faqs': [
            (
                'What does courage mean as a value?',
                'Courage as a value means facing fear, pressure, or uncertainty in service of something that matters. It turns bravery into action instead of treating it as a personality trait.',
            ),
            (
                'How do I practice courage in daily life?',
                'Practice courage by choosing one honest, values-aligned action in a moment when avoidance would be easier. Start small: ask the question, set the boundary, make the attempt, or tell the truth clearly.',
            ),
            (
                'Is courage the same as bravery?',
                'Courage and bravery are closely related, but courage is often more inward and sustained. Bravery may describe the bold act; courage describes the value that helps you take that act while fear is present.',
            ),
        ],
    },
    'integrity': {
        'why': (
            'Integrity matters because it keeps a person internally whole. It asks whether your public actions, '
            'private choices, stated beliefs, and real incentives are telling the same story. Without integrity, '
            'values become branding. With integrity, trust has somewhere to land because people can see a line '
            'between what you say, what you maintain, what you uphold, and what you refuse. It is not perfection; '
            'it is the repeated willingness to live close enough to the truth that repair is still possible.'
        ),
        'examples': [
            'A founder practices integrity by turning down a partnership that would bring fast money but quietly break the promise they made to customers.',
            'A friend practices integrity by admitting they repeated something private, apologizing without theatrics, and asking what repair would actually help.',
            'A team practices integrity when it documents a mistake instead of hiding it inside polished language.',
        ],
        'practice': [
            'Name the standard you are trying to uphold before the easier option starts sounding reasonable.',
            'Compare your stated value with the last decision you made under pressure; look for the gap without dramatizing it.',
            'Ask where convenience is quietly rewriting your standards.',
            'Make one repair without defending the original mistake first.',
            'Practice one small no while the cost is still small, so your larger yes can stay honest.',
        ],
        'faqs': [
            (
                'What does integrity mean as a value?',
                'Integrity means living in a way that stays true to your principles even when there is pressure to bend them. It connects honesty, consistency, responsibility, and repair.',
            ),
            (
                'How do I practice integrity?',
                'Practice integrity by aligning small choices with stated commitments. Tell the truth earlier, keep promises you make casually, disclose conflicts, and repair harm when your behavior falls short.',
            ),
            (
                'Why is integrity important in relationships?',
                'Integrity makes trust possible because people do not have to guess which version of you will show up. It creates a stable connection between your words, actions, and accountability.',
            ),
        ],
    },
    'compassion': {
        'why': (
            'Compassion matters because it keeps care connected to action. It is not simply feeling bad for someone; '
            'it is the movement from noticing pain to responding with dignity. Compassion asks you to listen before '
            'you fix, support without taking over, and comfort without making someone perform gratitude for your '
            'help. It protects people from being reduced to their hardest moment. The Howdy Human question is: '
            '"What would help without making this person smaller?"'
        ),
        'examples': [
            'A manager practices compassion by adjusting expectations after an employee\'s family emergency, then naming what can wait and what support is available.',
            'A sibling practices compassion by listening to the same hard story again without rushing to shame, fix, compare, or make the pain convenient.',
            'A community practices compassion when it designs help that preserves choice instead of turning need into spectacle.',
        ],
        'practice': [
            'Ask, "Do you want listening, help solving this, or something practical right now?"',
            'Separate someone\'s pain from your need to be the rescuer.',
            'Use language that preserves dignity, especially when someone is struggling.',
            'Offer one concrete support: a ride, a meal, a phone call, a deadline adjustment, a quiet presence.',
            'Check whether your help gives the person more choice or quietly takes choice away.',
        ],
        'faqs': [
            (
                'What does compassion mean as a value?',
                'Compassion means noticing suffering and responding with care, respect, and useful support. It turns empathy into action while preserving the other person\'s dignity.',
            ),
            (
                'How do I practice compassion without overextending myself?',
                'Practice compassion with boundaries by offering specific, sustainable help. Compassion does not require rescuing everyone; it requires responding honestly to what you can actually give.',
            ),
            (
                'What is the difference between compassion and empathy?',
                'Empathy is the ability to feel with or understand another person. Compassion adds a caring response, asking what support, presence, or protection would be useful now.',
            ),
        ],
    },
    'clarity': {
        'why': (
            'Clarity matters because confusion quietly burns energy. When a thought, agreement, boundary, or next '
            'step is unclear, people start filling the gaps with assumptions. Clarity is a service value: it helps '
            'people define what is true, explain what is needed, focus on the next move, and align around reality '
            'instead of mood. It does not mean removing all complexity. It means making the next true thing '
            'understandable enough to act on.'
        ),
        'examples': [
            'A facilitator practices clarity by ending a messy meeting with three plain lines: what was decided, who owns it, and when it will happen.',
            'A partner practices clarity by saying, "I want reassurance, not advice," instead of hoping the other person can decode the silence.',
            'A creator practices clarity by removing clever language that hides the actual promise of the work.',
        ],
        'practice': [
            'Rewrite the point in one plain sentence before adding nuance.',
            'Clarify the difference between what is known, what is assumed, and what is being requested.',
            'Ask "What is the next action?" when a conversation starts circling.',
            'Define the owner, deadline, and decision before a meeting or message ends.',
            'Use fewer words when the extra words are protecting you from being direct.',
        ],
        'faqs': [
            (
                'What does clarity mean as a value?',
                'Clarity means making thoughts, choices, expectations, and next steps understandable enough to act on. It values truth, directness, and shared understanding.',
            ),
            (
                'How do I practice clarity in communication?',
                'Practice clarity by naming the point, the request, and the next step. Remove vague phrases, check for understanding, and distinguish what you know from what you are assuming.',
            ),
            (
                'Is clarity the same as simplicity?',
                'Clarity and simplicity overlap, but they are not the same. Simplicity removes complexity; clarity helps people navigate complexity without losing the thread.',
            ),
        ],
    },
    'self-awareness': {
        'why': (
            'Self-awareness matters because you cannot practice your values honestly if you cannot see your own '
            'patterns. It is the value of noticing what you feel, what you avoid, what you repeat, and how your '
            'presence affects other people. Understanding your own thoughts, feelings, and actions is not '
            'self-obsession; it is how you stop confusing a reflex with a truth. Self-awareness asks you to reflect, '
            'examine, recognize, acknowledge, and observe before you turn a reaction into a story.'
        ),
        'examples': [
            'A leader practices self-awareness by noticing that their own urgency is making every request sound like a crisis, then slowing the message before sending it.',
            'A friend practices self-awareness by recognizing the impulse to disappear, then saying, "I need space tonight, and I will come back to this tomorrow."',
            'A learner practices self-awareness by separating discomfort with feedback from evidence that the feedback is wrong.',
        ],
        'practice': [
            'Reflect on one repeated reaction before deciding what it means about the other person.',
            'Name the body cue that shows up before the pattern: tight chest, rushing, freezing, performing, disappearing.',
            'Ask what feeling is present before deciding what story is true.',
            'Notice the gap between your intention and your impact, then repair the impact without overexplaining the intention.',
            'Use journaling, a voice note, or honest feedback to make one repeated pattern visible.',
        ],
        'faqs': [
            (
                'What does self-awareness mean as a value?',
                'Self-awareness means understanding your own thoughts, feelings, motives, and patterns well enough to make more honest choices. It connects reflection to responsibility.',
            ),
            (
                'How do I practice self-awareness?',
                'Practice self-awareness by pausing before reacting, naming what you feel, reviewing repeated patterns, and asking trusted people how your behavior lands with them.',
            ),
            (
                'Can self-awareness become overthinking?',
                'Yes. Self-awareness becomes overthinking when reflection never turns into a clearer choice. Healthy self-awareness helps you act with more honesty, not stay trapped in analysis.',
            ),
        ],
    },
    'love': {
        'why': (
            'Love matters because care has to become something a person can experience, not just something another '
            'person claims to feel. It shows up in how we cherish, support, nurture, repair, and stay connected '
            'without using affection as control. Love is not only intensity. It is attention with a memory: the '
            'choice to keep valuing someone or something through ordinary needs, changing seasons, and inconvenient '
            'truths. Howdy Human treats love as a verb long before it becomes a declaration.'
        ),
        'examples': [
            'A parent practices love by setting a firm boundary around screen time, then staying present through the child\'s anger instead of withdrawing warmth.',
            'A partner practices love by noticing their spouse is overwhelmed, taking one concrete task off the list, and asking what support would actually feel useful tonight.',
            'A friend practices love by celebrating a hard-won success without comparing it to their own timeline.',
        ],
        'practice': [
            'Ask what care would look like as an action today: support, patience, protection, repair, or honest attention.',
            'Cherish someone without needing the moment to become sentimental or impressive.',
            'Name one way you can nurture the relationship without taking responsibility for the other person\'s whole life.',
            'Practice one repair quickly, before distance starts pretending to be peace.',
            'Check whether your version of love gives the other person more room to be real.',
        ],
        'faqs': [
            (
                'What does love mean as a value?',
                'Love as a value means choosing care, connection, and faithful attention in ways another person can actually feel. It becomes visible through support, repair, nurture, and respect.',
            ),
            (
                'How do I practice love in daily life?',
                'Practice love by turning affection into a concrete action: listen fully, keep a promise, repair a rupture, support a need, or protect a boundary that helps the relationship stay honest.',
            ),
            (
                'Is love only a feeling?',
                'Love includes feeling, but as a value it also asks for behavior. The feeling matters, but the practice is what makes love trustworthy over time.',
            ),
        ],
    },
    'forgiveness': {
        'why': (
            'Forgiveness matters because resentment can keep pain in charge long after the original moment has passed. '
            'It does not mean pretending harm was fine, rushing trust, or giving someone unlimited access to you. '
            'Forgiveness is the practice of releasing the grip that anger has on your future while still telling the '
            'truth about what happened. Sometimes it heals a relationship. Sometimes it simply helps you stop carrying '
            'the injury as your only evidence of wisdom.'
        ),
        'examples': [
            'A woman practices forgiveness after a sibling misses an important family event by naming the hurt directly, listening to the explanation, and deciding what kind of contact feels honest now.',
            'A friend practices forgiveness by accepting a sincere apology while still asking for a changed behavior before trust is rebuilt.',
            'A person practices forgiveness privately when they stop rehearsing an old betrayal every morning and choose one action that belongs to their present life.',
        ],
        'practice': [
            'Separate forgiveness from access: you can release resentment without reopening every door.',
            'Name what actually hurt before trying to move past it.',
            'Ask what needs to heal: your nervous system, the relationship, the story you tell, or the boundary that failed.',
            'Accept repair only where behavior has changed enough to make trust possible again.',
            'Notice when retelling the story is protecting you and when it is keeping you stuck.',
        ],
        'faqs': [
            (
                'What does forgiveness mean as a value?',
                'Forgiveness means releasing anger or resentment without denying that harm happened. As a value, it helps healing become possible while still respecting truth and boundaries.',
            ),
            (
                'How do I practice forgiveness?',
                'Practice forgiveness by naming the hurt honestly, deciding what repair or boundary is needed, and choosing one action that loosens resentment without forcing premature trust.',
            ),
            (
                'Does forgiveness mean reconciliation?',
                'No. Forgiveness may support reconciliation, but it does not require it. Sometimes forgiveness means releasing the hold of the wound while keeping a clear and necessary boundary.',
            ),
        ],
    },
    'trust': {
        'why': (
            'Trust matters because openness needs somewhere safe to land. It is built through honest words, reliable '
            'follow-through, and the repeated experience of not being punished for telling the truth. Trust is not a '
            'demand someone can make because they want closeness; it is evidence gathered over time. To trust is to '
            'believe, rely, confide, and commit with enough steadiness that the relationship can hold more reality.'
        ),
        'examples': [
            'A team lead builds trust by telling staff about a budget problem early, admitting what they do not know, and following through on every update date they promised.',
            'A friend builds trust by keeping a vulnerable conversation private even when sharing it would make them feel important.',
            'A partner rebuilds trust by making a clear agreement, keeping it repeatedly, and accepting that reassurance may be needed for a while.',
        ],
        'practice': [
            'Keep one small promise exactly as stated.',
            'Say what you know, what you do not know, and when you will follow up.',
            'Do not ask someone to confide in you if you have not shown you can protect what they share.',
            'Repair broken trust with changed behavior, not pressure for the other person to move on.',
            'Notice whether your reliability increases someone else\'s freedom to be honest.',
        ],
        'faqs': [
            (
                'What does trust mean as a value?',
                'Trust means creating enough honesty, reliability, and care that people can rely on one another. It becomes visible through follow-through, discretion, repair, and consistent behavior.',
            ),
            (
                'How do I practice trust?',
                'Practice trust by being clear, keeping commitments, protecting what is shared with you, and repairing quickly when your behavior makes openness feel unsafe.',
            ),
            (
                'Can trust be rebuilt after it is broken?',
                'Yes, but trust is rebuilt through repeated evidence, not urgency. Changed behavior, honest accountability, and patience matter more than asking someone to trust again quickly.',
            ),
        ],
    },
    'purpose': {
        'why': (
            'Purpose matters because it gives action a direction deeper than momentum. It helps a person define what '
            'they are pursuing, what they are willing to create, and what they do not need to chase anymore. Purpose '
            'does not always arrive as a lightning bolt. Often it is discovered through service, grief, curiosity, '
            'work, anger, tenderness, or the repeated sense that something is asking to be lived more honestly.'
        ),
        'examples': [
            'After tutoring one student through a housing crisis, a social worker begins pursuing tenant advocacy because the work makes her skills feel aligned with something larger than a job title.',
            'A designer rediscovers purpose by creating accessible tools for caregivers after watching their own family struggle to navigate confusing systems.',
            'A person in recovery practices purpose by choosing one weekly commitment that helps someone else and gives their own healing a direction.',
        ],
        'practice': [
            'Ask which problems keep getting your attention even when nobody rewards you for noticing.',
            'Define purpose as a next faithful action, not a complete life plan.',
            'Notice where your skills, pain, curiosity, and care keep meeting the same kind of need.',
            'Choose one small way to pursue the work before you understand the whole path.',
            'Let purpose narrow your yeses so your energy can express something real.',
        ],
        'faqs': [
            (
                'What does purpose mean as a value?',
                'Purpose means having a reason that guides actions and decisions. As a value, it helps a person pursue, define, create, and live in alignment with what feels meaningful.',
            ),
            (
                'How do I practice purpose?',
                'Practice purpose by choosing one meaningful action before the whole path is clear. Look for the needs, questions, and commitments that keep asking for your attention.',
            ),
            (
                'Does purpose have to be one big life mission?',
                'No. Purpose can be a season, a practice, a relationship, a body of work, or a next right action. It becomes clearer through movement, not just reflection.',
            ),
        ],
    },
    'community': {
        'why': (
            'Community matters because people are not meant to carry every need, celebration, repair, and emergency '
            'alone. It is more than being near each other or liking the same things. Community becomes real when '
            'people connect, participate, contribute, share, and build enough trust to be useful to one another. '
            'Belonging is the felt experience; community is the shared practice that makes belonging more possible.'
        ),
        'examples': [
            'After an apartment fire, neighbors practice community by making a shared spreadsheet for meals, rides, temporary furniture, and childcare instead of only posting sympathy online.',
            'A local art group practices community by inviting a new member into the setup crew, not just the audience, so participation becomes belonging.',
            'A neighborhood practices community when people who disagree about politics still organize together to keep the park safe and usable.',
        ],
        'practice': [
            'Move from observing to participating: attend, introduce yourself, volunteer, or ask what is needed.',
            'Contribute one useful thing before deciding whether you fully belong.',
            'Share information, tools, space, or attention in a way that makes life easier for someone nearby.',
            'Build trust through repeated small presence, not one dramatic gesture.',
            'Ask whether your community includes people when they need help, not only when they are easy to enjoy.',
        ],
        'faqs': [
            (
                'What does community mean as a value?',
                'Community means building shared support, participation, and connection among people with common needs, places, interests, or values. It turns belonging into practice.',
            ),
            (
                'How do I practice community?',
                'Practice community by showing up consistently, contributing something useful, sharing resources, and helping create conditions where more people can participate and belong.',
            ),
            (
                'How is community related to belonging?',
                'Belonging is the felt sense of being included and known. Community is the shared structure of connection, contribution, and care that can make belonging more likely.',
            ),
        ],
    },
    'resilience': {
        'why': (
            'Resilience matters because life will ask people to keep living after disappointment, disruption, and loss. '
            'It is not pretending to be unaffected. It is the ability to adapt, withstand, persist, and strengthen '
            'without turning pain into your whole identity. Resilience honors the bruise and still asks what can grow '
            'next. The Howdy Human version is not "bounce back" as if nothing happened; it is come back changed and '
            'still capable of choosing.'
        ),
        'examples': [
            'After a small business loses its biggest client, the owner practices resilience by naming the fear, cutting expenses honestly, calling past customers, and rebuilding the offer one week at a time.',
            'A student practices resilience by retaking a failed exam after asking for tutoring instead of deciding one grade defines their future.',
            'A caregiver practices resilience by accepting help before exhaustion becomes the only proof of devotion.',
        ],
        'practice': [
            'Name what changed before you demand that you feel fine about it.',
            'Choose one stabilizing action: sleep, food, a call, a plan, a boundary, or the next appointment.',
            'Ask what you can adapt without abandoning yourself.',
            'Persist in small units of time when the whole future feels too large.',
            'Track one sign that the hard thing is changing you without erasing you.',
        ],
        'faqs': [
            (
                'What does resilience mean as a value?',
                'Resilience means adapting and continuing after difficulty without denying that difficulty happened. It becomes visible through persistence, recovery, support, and changed strength.',
            ),
            (
                'How do I practice resilience?',
                'Practice resilience by stabilizing first, then choosing one next action. Adapt what can change, seek support, and let persistence happen in small honest steps.',
            ),
            (
                'Is resilience the same as toughness?',
                'No. Toughness can become emotional armor. Resilience includes flexibility, support, recovery, and the ability to keep choosing after something has been hard.',
            ),
        ],
    },
    'kindness': {
        'why': (
            'Kindness matters because ordinary life gives people constant chances to make one another feel more or '
            'less human. It is not niceness for approval. Kindness is care with a direction: help, share, offer, '
            'extend, give, assist, serve. It notices the person inside the errand, the worker inside the role, the '
            'stranger inside the delay. A kind action may be small, but it changes the temperature of the room.'
        ),
        'examples': [
            'A supervisor practices kindness by noticing a new employee is overwhelmed, walking them through the first task, and checking back without making them feel foolish.',
            'A commuter practices kindness by helping an older passenger carry groceries after a bus delay has made everyone impatient.',
            'A neighbor practices kindness by offering a specific errand instead of saying, "Let me know if you need anything," and disappearing.',
        ],
        'practice': [
            'Look for one person whose day could be made easier by a specific offer.',
            'Use the person\'s name when you can; it turns a role back into a human being.',
            'Offer help that preserves dignity instead of creating a performance of gratitude.',
            'Share credit, information, patience, or practical support before anyone asks perfectly.',
            'Make kindness concrete enough that someone does not have to decode your good intentions.',
        ],
        'faqs': [
            (
                'What does kindness mean as a value?',
                'Kindness means showing care and consideration through words and actions. As a value, it becomes visible when someone helps, offers, shares, supports, or serves with dignity.',
            ),
            (
                'How do I practice kindness?',
                'Practice kindness by making care specific: offer useful help, speak with respect, notice overlooked people, share what you can, and reduce unnecessary difficulty for someone else.',
            ),
            (
                'Is kindness the same as being nice?',
                'No. Niceness often tries to keep things pleasant. Kindness is deeper; it cares about dignity, usefulness, and the actual effect of your actions.',
            ),
        ],
    },
    'honesty': {
        'why': (
            'Honesty matters because reality cannot be repaired while everyone is performing around it. It is the '
            'practice of speaking, admitting, acknowledging, revealing, and sharing what is truthful and transparent '
            'in words, thoughts, and actions. Honesty is not bluntness for its own sake. It is a form of respect: for '
            'yourself, for the other person, and for the decision that has to be made with real information instead '
            'of hiding, guessing, or lying by omission.'
        ),
        'examples': [
            'A CEO practices honesty by telling employees that layoffs are possible, explaining what is known, naming what is not known, and refusing to hide behind cheerful vagueness.',
            'A friend practices honesty by admitting they feel jealous instead of disguising the feeling as criticism.',
            'A student practices honesty by telling a teacher they used outside help on an assignment and asking how to make it right.',
        ],
        'practice': [
            'Ask what truth is being avoided because it might change the room.',
            'Speak the truth with enough context that it can be understood, not just dropped.',
            'Admit what you know, what you did, what you feel, or what you are not ready to promise.',
            'Acknowledge the impact of honesty; truth still needs care in how it lands.',
            'Use honesty to make repair and clear decisions possible, not to punish someone with your unfiltered reaction.',
        ],
        'faqs': [
            (
                'What does honesty mean as a value?',
                'Honesty means being truthful and transparent in thoughts, words, and actions. It becomes a value when truth is used to build trust, clarity, repair, and real choice.',
            ),
            (
                'How do I practice honesty?',
                'Practice honesty by naming what is true, admitting what needs repair, and sharing information clearly enough that others can respond to reality instead of guessing.',
            ),
            (
                'Is honesty the same as bluntness?',
                'No. Bluntness may ignore impact. Honesty as a value tells the truth with responsibility, context, and respect for what the truth makes possible.',
            ),
        ],
    },
    'responsibility': {
        'why': (
            'Responsibility matters because promises need hands and feet. It is the value of accepting what is yours '
            'to own, fulfilling what you agreed to do, and managing the consequences when something goes wrong. '
            'Responsibility is not carrying everything. It is telling the truth about your part, completing what you '
            'can complete, and not making other people chase you for the accountability you already know is needed.'
        ),
        'examples': [
            'A project manager practices responsibility after a budget overrun by explaining the mistake, owning the missed check-in, and bringing a revised plan instead of blaming the team.',
            'A parent practices responsibility by apologizing for yelling, naming what they will do differently, and following through the next time stress rises.',
            'A roommate practices responsibility by replacing the broken item before being asked three times.',
        ],
        'practice': [
            'Name what is actually yours to own, and what is not.',
            'Complete one promise before making a new one.',
            'If something went wrong, acknowledge your part before explaining the context.',
            'Manage the next step: timeline, repair, replacement, conversation, or follow-up.',
            'Ask whether someone else is carrying stress because you have delayed accountability.',
        ],
        'faqs': [
            (
                'What does responsibility mean as a value?',
                'Responsibility means being accountable for your actions and commitments. It becomes visible when someone owns their part, follows through, repairs harm, and completes what they promised.',
            ),
            (
                'How do I practice responsibility?',
                'Practice responsibility by naming your part clearly, doing what you agreed to do, communicating early when something changes, and repairing the impact of missed commitments.',
            ),
            (
                'Is responsibility the same as taking blame?',
                'No. Responsibility is not absorbing blame for everything. It is accurately owning your part and taking useful action where your choices have created an obligation or impact.',
            ),
        ],
    },
    'willingness': {
        'why': (
            'Willingness matters because many values begin before confidence arrives. It is the readiness to accept '
            'what is needed, offer what you can, participate before you feel expert, and engage with the next honest '
            'step. Willingness is not blind agreement. It is an open-handed posture toward growth, repair, service, '
            'and change. Sometimes the whole door does not open; willingness is putting your hand on the handle.'
        ),
        'examples': [
            'A team practices willingness when a plan fails and everyone stops defending their original idea long enough to learn the new tool, adjust roles, and try again.',
            'A person in therapy practices willingness by trying one uncomfortable communication exercise before deciding it will not work.',
            'A volunteer practices willingness by showing up for the setup shift, not only the visible part of the event.',
        ],
        'practice': [
            'Ask what you are willing to try before you ask whether you feel ready.',
            'Accept one piece of reality you have been negotiating with.',
            'Offer one useful action instead of waiting to be perfectly certain.',
            'Participate in the next step before you understand the whole process.',
            'Notice the difference between unwillingness and a real boundary; respect the boundary, question the avoidance.',
        ],
        'faqs': [
            (
                'What does willingness mean as a value?',
                'Willingness means readiness to engage, accept, offer, or undertake what is needed. As a value, it helps people move before certainty or confidence is complete.',
            ),
            (
                'How do I practice willingness?',
                'Practice willingness by choosing one small next step: participate, try, ask, offer, accept feedback, or engage with the part of reality that is already asking for a response.',
            ),
            (
                'Is willingness the same as saying yes to everything?',
                'No. Willingness is not people-pleasing. It means being open to the next honest action while still respecting real limits, consent, and boundaries.',
            ),
        ],
    },
}


def slugify(text: str) -> str:
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')
    return slug or 'item'


def safe_excerpt(text: str, limit: int = 160) -> str:
    clean = ' '.join(text.split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rsplit(' ', 1)[0] + '…'


def render_json_ld(data: dict) -> str:
    rendered = json.dumps(data, ensure_ascii=False, indent=2)
    return rendered.replace('</', '<\\/')


def breadcrumb_schema(items: list[tuple[str, str]]) -> dict:
    return {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': index + 1,
                'name': name,
                'item': url,
            }
            for index, (name, url) in enumerate(items)
        ],
    }


def breadcrumb_nav(items: list[tuple[str, str | None]]) -> str:
    parts = []
    last_index = len(items) - 1
    for index, (label, href) in enumerate(items):
        escaped_label = html.escape(label)
        if index == last_index or not href:
            parts.append(f'<span aria-current="page">{escaped_label}</span>')
            continue

        parts.append(f'<a href="{html.escape(href)}">{escaped_label}</a>')
        parts.append('<span aria-hidden="true">/</span>')

    return f'<nav class="breadcrumbs" aria-label="Breadcrumb">{"".join(parts)}</nav>'


def html_page(
    title: str,
    description: str,
    canonical_path: str,
    body: str,
    *,
    head_extra: str = '',
    robots: str | None = None,
) -> str:
    canonical_url = f'{SITE_URL}{canonical_path}'
    robots_meta = f'  <meta name="robots" content="{html.escape(robots)}" />\n' if robots else ''
    extra = f'{head_extra.rstrip()}\n' if head_extra else ''

    return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>{html.escape(title)}</title>
  <meta name=\"description\" content=\"{html.escape(description)}\" />
{robots_meta}  <link rel=\"canonical\" href=\"{html.escape(canonical_url)}\" />
  <meta property=\"og:site_name\" content=\"Howdy Human\" />
  <meta property=\"og:title\" content=\"{html.escape(title)}\" />
  <meta property=\"og:description\" content=\"{html.escape(description)}\" />
  <meta property=\"og:type\" content=\"website\" />
  <meta property=\"og:url\" content=\"{html.escape(canonical_url)}\" />
  <meta name=\"twitter:card\" content=\"summary\" />
  <link rel=\"icon\" type=\"image/x-icon\" href=\"/favicon.ico\" />
  <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />
{extra}  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.55; margin: 0; color: #1f2a2a; background: #edf4ef; }}
    main {{ max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }}
    article {{ background: #fff; border: 1px solid #d8e3db; border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,.05); }}
    h1 {{ margin-top: 0; line-height: 1.2; }}
    h2 {{ margin-top: 1.5rem; font-size: 1.1rem; }}
    p {{ margin: .65rem 0; }}
    ul {{ margin: .5rem 0 0; padding-left: 1.1rem; }}
    a {{ color: #225f45; }}
    .meta {{ color: #495452; font-size: .95rem; }}
    .breadcrumbs {{ display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: 1rem; color: #5f6f68; font-size: .9rem; }}
    .breadcrumbs a {{ color: #225f45; text-decoration: none; }}
    .breadcrumbs a:hover {{ text-decoration: underline; }}
    .chip {{ display: inline-block; border: 1px solid #b8c8be; border-radius: 999px; padding: .2rem .65rem; margin: .2rem .35rem .2rem 0; font-size: .85rem; text-decoration: none; color: #234834; }}
    .category-value-list {{ display: grid; gap: .75rem; padding-left: 0; list-style: none; }}
    .category-value-list li {{ border-top: 1px solid #e5eee8; padding-top: .75rem; }}
    .category-value-list a {{ display: block; font-weight: 700; }}
    .category-value-list span {{ display: block; margin-top: .2rem; color: #495452; }}
  </style>
</head>
<body>
  <main>
    {body}
  </main>
</body>
</html>
"""


def ensure_clean_directory(parent: Path, valid_slugs: set[str]) -> None:
    for child in parent.iterdir():
        if child.is_dir() and child.name not in valid_slugs:
            for nested in child.rglob('*'):
                if nested.is_file():
                    nested.unlink()
            for nested in sorted(child.rglob('*'), reverse=True):
                if nested.is_dir():
                    nested.rmdir()
            child.rmdir()


def write_sitemap(value_slugs: list[str], category_slugs: list[str]) -> None:
    urls = [f'{SITE_URL}/', f'{SITE_URL}/values-as-verbs/', f'{SITE_URL}/values-in-action-audit/']
    urls.extend(f'{SITE_URL}/values/category/{slug}/' for slug in category_slugs)
    urls.extend(f'{SITE_URL}/values/{slug}/' for slug in value_slugs)

    sitemap = '\n'.join(
        ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        + [f'  <url><loc>{url}</loc></url>' for url in urls]
        + ['</urlset>', '']
    )
    (ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')


def value_meta_description(name: str, description: str, example: str) -> str:
    if example:
        return safe_excerpt(f'{name}: {description} Example: {example}', 158)
    return safe_excerpt(f'{name}: {description}', 158)


def related_values_for(value: dict, values_by_tag: dict[str, list[dict]], limit: int = 8) -> list[dict]:
    related_values = []
    for tag in [t for t in value.get('tags', []) if t][:3]:
        related_values.extend(v for v in values_by_tag.get(tag, []) if v['name'] != value['name'])

    seen = set()
    unique_related = []
    for item in related_values:
        if item['name'] in seen:
            continue
        seen.add(item['name'])
        unique_related.append(item)

    return unique_related[:limit]


def tag_links_markup(tags: list[str]) -> str:
    return ''.join(
        f'<a class="chip" href="/verbs/{slugify(tag)}/">{html.escape(tag)}</a>' for tag in tags
    ) or '<p class="meta">No related verbs listed.</p>'


def related_values_markup(related_values: list[dict]) -> str:
    related_markup = ''.join(
        f'<li><a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a></li>'
        for item in related_values
    )
    return related_markup or '<li>Explore more in the full dictionary.</li>'


def natural_list(items: list[str]) -> str:
    cleaned = [item for item in items if item]
    if not cleaned:
        return ''
    if len(cleaned) == 1:
        return cleaned[0]
    if len(cleaned) == 2:
        return f'{cleaned[0]} and {cleaned[1]}'
    return f'{", ".join(cleaned[:-1])}, and {cleaned[-1]}'


def variant_index(seed: str, count: int) -> int:
    digest = hashlib.sha256(seed.encode('utf-8')).hexdigest()
    return int(digest[:8], 16) % count


def build_generated_value_content(value: dict, related_values: list[dict]) -> dict:
    name = value['name']
    name_lower = name.lower()
    description = value['description'].rstrip('.')
    category = value.get('category') or 'Uncategorized'
    tags = [tag for tag in value.get('tags', []) if tag]
    primary_verbs = tags[:4] or ['notice', 'choose', 'practice', 'reflect']
    related_names = [item['name'] for item in related_values[:3]]
    related_phrase = natural_list(related_names) or 'nearby values'
    verb_phrase = natural_list(primary_verbs)
    category_context = CATEGORY_CONTEXTS.get(category, CATEGORY_CONTEXTS['Uncategorized'])
    first = primary_verbs[0]
    second = primary_verbs[min(1, len(primary_verbs) - 1)]
    third = primary_verbs[min(2, len(primary_verbs) - 1)]
    idx = variant_index(name, 16)
    category_lens_options = CATEGORY_LENSES.get(category, CATEGORY_LENSES['Uncategorized'])
    category_lens = category_lens_options[idx % len(category_lens_options)]

    why_openers = [
        f'{name} matters when "{description}" has to become more than a sentence someone agrees with.',
        f'{name} becomes visible when a person treats "{description}" as a standard for action, not just a belief.',
        f'{name} matters because "{description}" can either stay abstract or become something people can observe.',
        f'{name} gives shape to "{description}" by asking what a person is willing to do when the moment gets specific.',
        f'{name} becomes useful when "{description}" starts guiding real choices instead of staying in private intention.',
        f'{name} matters because the idea of "{description}" is only trustworthy when it changes behavior.',
        f'{name} turns "{description}" into a lived value by giving it a form other people can notice.',
        f'{name} matters when "{description}" becomes a practice someone can return to under pressure.',
    ]
    why_bridges = [
        f'You can often see it in the decision to {first}, especially when nobody is forcing that choice.',
        f'It often shows up through the willingness to {first} before the situation is neat or fully rewarded.',
        f'One signal is the choice to {first} when a more automatic reaction would be easier.',
        f'It becomes concrete when someone chooses to {first} and lets that action carry the value.',
        f'The value is easier to recognize when the action is specific: to {first}, to {second}, or to {third}.',
        f'It appears in the small verbs around it: {first}, {second}, and {third}.',
        f'Instead of asking whether someone "has" {name_lower}, the better question is whether they {first} when it counts.',
        f'This is why the verb map matters: {first}, {second}, and {third} make {name_lower} easier to spot in real life.',
    ]
    why_followups = [
        f'For {name_lower}, the practical test is whether the next choice becomes more honest, more intentional, or more aligned.',
        f'That keeps {name_lower} from becoming decoration and turns it into something a person can actually practice.',
        f'The most useful question is not whether {name_lower} sounds good, but where it changes the next behavior.',
        f'In that sense, {name_lower} is less about claiming the word and more about making one observable choice.',
        f'This gives {name_lower} enough specificity to be noticed in a conversation, routine, decision, or repair.',
        f'Without that behavioral edge, {name_lower} can stay vague even when the word feels important.',
        f'The goal is to make {name_lower} concrete enough that another person could recognize the value in motion.',
        f'That is where the value earns trust: in the gap between what someone says matters and what they actually do.',
    ]
    why = (
        f'{why_openers[idx % len(why_openers)]} {category_lens} '
        f'{why_bridges[(idx + 3) % len(why_bridges)]} {why_followups[(idx + 7) % len(why_followups)]}'
    )

    example_patterns = [
        f'In practice, {name_lower} can show up {category_context["scene"]}: someone starts with the action behind "{first}" instead of leaving the value as a private intention.',
        f'When {category_context["pressure"]} starts to pull attention away from {name_lower}, the value becomes concrete by returning to "{second}" as a next move.',
        f'One small example is a {category_context["practice"]}: using "{third}" to make {name_lower} observable in one decision.',
        f'{name} can also appear through its neighboring values, such as {related_phrase}, when the situation asks someone to {first} with more intention and precision.',
        f'Instead of treating {name_lower} as an identity label, someone might practice it by choosing the action behind "{second}", naming what it protects, and noticing what it interrupts.',
        f'In a specific decision, {name_lower} becomes easier to recognize when the person can name what they are choosing to {third} and what that action serves.',
        f'When the moment is messy, {name_lower} may look like choosing to {first} before the perfect language, timing, or permission arrives.',
        f'A repeated sign of {name_lower} is the willingness to {second} even when the reward is delayed, private, or hard to measure.',
        f'{name} becomes practical when someone can point to one behavior, such as "{first}", and explain why that behavior fits the moment.',
        f'Another example is choosing "{third}" in a small but visible way before the value has become easy or automatic.',
        f'When {name_lower} is working, the action usually leaves a trace: something gets protected, clarified, repaired, strengthened, or changed.',
        f'{name} can be practiced quietly, too, through the choice to {second} without turning the action into proof of identity.',
    ]
    examples = [
        example_patterns[idx % len(example_patterns)],
        example_patterns[(idx + 5) % len(example_patterns)],
    ]

    practice_patterns = [
        f'Find one real situation {category_context["scene"]}, then choose one action connected to "{first}".',
        f'Use the phrase "{description}" as a check: what action would make that definition visible today?',
        f'Compare {name_lower} with {related_phrase}; notice where they support each other and where they ask for different actions.',
        f'After acting, ask whether someone else could have observed {name_lower} in what you actually did.',
        f'Write down the smallest possible version of the action behind "{second}" and use it to resist {category_context["pressure"]}.',
        f'Notice where you talk about {name_lower} more easily than you practice it, then choose one concrete verb to close that gap.',
        f'Reread the opening example and name the exact behavior that made {name_lower} visible.',
        f'When the situation gets blurry, return to the action words: {verb_phrase}.',
        f'Pick one verb from the map, such as "{third}", and use it in a situation small enough to finish today.',
        f'Ask what {name_lower} would change in the next conversation, errand, decision, or repair.',
        f'Name the pressure that makes {name_lower} harder, then choose one action that answers that pressure directly.',
        f'Turn the definition into a sentence that starts with "Today I will..." and includes one concrete behavior.',
        f'Look for the place where {name_lower} is being admired but not enacted, then choose the smallest useful action.',
        f'Choose one related value, such as {related_phrase}, and decide whether the moment needs that value, {name_lower}, or both.',
        f'Use "{first}" as the test: what would be different by the end of the day if that action really happened?',
        f'Make the value visible to one other person through a choice they could actually notice.',
    ]
    practice = [
        practice_patterns[idx % len(practice_patterns)],
        practice_patterns[(idx + 5) % len(practice_patterns)],
        practice_patterns[(idx + 9) % len(practice_patterns)],
        practice_patterns[(idx + 13) % len(practice_patterns)],
    ]

    meaning_answers = [
        f'{name} means {description}. It becomes a lived value when someone uses actions like {verb_phrase} to make that meaning visible in a real situation.',
        f'{name} is the value of treating "{description}" as something to practice, not just something to believe. Its behavioral signals include {verb_phrase}.',
        f'As a value, {name_lower} points to {description}. You can usually recognize it through concrete actions such as {verb_phrase}.',
        f'{name} names the commitment behind {description}. The value becomes easier to see when someone chooses to {first}, {second}, or {third} under real constraints.',
        f'{name} describes {description}. The important question is what someone does with that meaning when a real choice is in front of them.',
        f'{name} is not only a word for {description}; it is also a pattern of behavior shaped by actions like {verb_phrase}.',
        f'{name} becomes a value when {description} starts influencing what someone chooses, refuses, repairs, or repeats.',
        f'To value {name_lower} is to let {description} guide behavior. The clearest clues are usually actions like {first}, {second}, and {third}.',
    ]
    practice_answers = [
        f'Practice {name_lower} by choosing one action connected to "{first}" and making it observable today. The goal is a real behavior, not a perfect description of the value.',
        f'Start with a situation where {category_context["pressure"]} is likely to take over. Then choose a small action connected to "{second}" that makes {name_lower} visible.',
        f'Use {name_lower} as a question before acting: what would it look like to {first} here? Then do the smallest honest version of that action.',
        f'To practice {name_lower}, pick one of its verbs, such as "{third}", and apply it to a specific conversation, decision, routine, or repair.',
        f'Practice begins by reducing {name_lower} to one doable behavior. Choose a moment, choose a verb like "{first}", and follow through before overexplaining it.',
        f'Look for a place where {name_lower} is already being tested. Use "{second}" as the next action, then notice what changed afterward.',
        f'Make {name_lower} practical by pairing it with a small commitment: one choice to {third}, one conversation to have, or one pattern to interrupt.',
        f'Choose a situation where the value has been mostly theoretical. Then make it visible through one action connected to {verb_phrase}.',
    ]
    related_answers = [
        f'{name} often connects with {related_phrase}. Those values can support {name_lower}, sharpen its meaning, or reveal a tension worth noticing.',
        f'Related values include {related_phrase}. Looking at them together can show whether the moment is asking for {name_lower}, something adjacent, or a blend of several values.',
        f'{related_phrase} sit close to {name_lower} in the dictionary. They help frame the situations where this value becomes useful or complicated.',
        f'{name} can overlap with {related_phrase}. Comparing them helps keep the value specific instead of letting it blur into a general good intention.',
        f'{related_phrase} are useful companions to {name_lower}. They show where this value may need support, balance, or clearer boundaries.',
        f'Values near {name_lower} include {related_phrase}. They are worth comparing when a situation feels morally or emotionally layered.',
        f'{name} shares territory with {related_phrase}, but each value points attention toward a slightly different action.',
        f'Looking at {related_phrase} alongside {name_lower} can make the choice in front of someone more precise.',
    ]
    faqs = [
        (f'What does {name_lower} mean as a value?', meaning_answers[idx % len(meaning_answers)]),
        (f'How do I practice {name_lower}?', practice_answers[(idx + 1) % len(practice_answers)]),
        (f'What values are related to {name_lower}?', related_answers[(idx + 2) % len(related_answers)]),
    ]

    return {
        'why': why,
        'examples': examples,
        'practice': practice,
        'faqs': faqs,
    }


def value_structured_data(
    *,
    name: str,
    description: str,
    canonical_url: str,
    category: str,
    category_slug: str,
    faq_items: list[tuple[str, str]] | None = None,
) -> str:
    graph = [
            breadcrumb_schema([
                ('Home', f'{SITE_URL}/'),
                ('Values', f'{SITE_URL}/#dictionary-panel'),
                (category, f'{SITE_URL}/values/category/{category_slug}/'),
                (name, canonical_url),
            ]),
            {
                '@type': 'DefinedTerm',
                '@id': f'{canonical_url}#definedterm',
                'name': name,
                'description': description,
                'url': canonical_url,
                'inDefinedTermSet': {
                    '@type': 'DefinedTermSet',
                    '@id': f'{SITE_URL}/#values',
                    'name': 'Howdy Human Dictionary of Values',
                    'url': f'{SITE_URL}/',
                },
            },
    ]

    if faq_items:
        graph.append({
            '@type': 'FAQPage',
            'mainEntity': [
                {
                    '@type': 'Question',
                    'name': question,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': answer,
                    },
                }
                for question, answer in faq_items
            ],
        })

    structured_data = render_json_ld({
        '@context': 'https://schema.org',
        '@graph': graph,
    })
    return f'  <script type="application/ld+json">\n{structured_data}\n  </script>'


def build_compact_value_page(value: dict, values_by_tag: dict[str, list[dict]]) -> tuple[str, str]:
    name = value['name']
    slug = slugify(name)
    description = value['description']
    example = value.get('example', '')
    category = value.get('category', 'Uncategorized')
    category_slug = slugify(category)
    tags = [t for t in value.get('tags', []) if t]
    canonical_path = f'/values/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'

    title = f'{name} Value Meaning & Example | Howdy Human'
    meta_description = value_meta_description(name, description, example)
    tag_links = tag_links_markup(tags)
    related_markup = related_values_markup(related_values_for(value, values_by_tag))
    head_extra = value_structured_data(
        name=name,
        description=description,
        canonical_url=canonical_url,
        category=category,
        category_slug=category_slug,
    )

    body = f"""
<article>
  {breadcrumb_nav([('Home', '/'), ('Values', '/#dictionary-panel'), (category, f'/values/category/{category_slug}/'), (name, None)])}
  <h1>{html.escape(name)}</h1>
  <p class=\"meta\"><strong>Category:</strong> <a href=\"/values/category/{category_slug}/\">{html.escape(category)}</a></p>
  <p>{html.escape(description)}</p>
  <h2>Example in action</h2>
  <p>{html.escape(example)}</p>
  <h2>Associated verbs</h2>
  <div>{tag_links}</div>
  <h2>Related values</h2>
  <ul>{related_markup}</ul>
</article>
"""
    return slug, html_page(title, meta_description, canonical_path, body, head_extra=head_extra)


def build_expanded_value_page(value: dict, values_by_tag: dict[str, list[dict]], content: dict) -> tuple[str, str]:
    name = value['name']
    slug = slugify(name)
    description = value['description']
    example = value.get('example', '')
    category = value.get('category', 'Uncategorized')
    category_slug = slugify(category)
    tags = [t for t in value.get('tags', []) if t]
    idx = variant_index(name, 8)
    canonical_path = f'/values/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'

    title = f'{name} Value Meaning, Examples & Practice | Howdy Human'
    meta_description = safe_excerpt(
        f'{name} as a value: {description} Explore examples, practice ideas, related values, and the verbs that bring {name.lower()} to life.',
        158,
    )
    tag_links = tag_links_markup(tags)
    related_markup = related_values_markup(related_values_for(value, values_by_tag))
    examples = [example, *content['examples'][:2]]
    examples_markup = ''.join(f'<li>{html.escape(item)}</li>' for item in examples if item)
    practice_markup = ''.join(f'<li>{html.escape(item)}</li>' for item in content['practice'])
    faq_markup = ''.join(
        f'''
    <dt>{html.escape(question)}</dt>
    <dd>{html.escape(answer)}</dd>'''
        for question, answer in content['faqs']
    )
    verb_intros = [
        f'In Howdy Human, {name.lower()} is tracked through action. These verbs show what the value can look like when someone does it.',
        f'These verbs turn {name.lower()} from an idea into behavior someone can notice, repeat, or practice.',
        f'The verb map below gives {name.lower()} a practical shape: each action is one way the value can become visible.',
        f'Use these verbs as behavioral signals for {name.lower()}, especially when the value feels too abstract to act on.',
        f'Think of these verbs as the active edge of {name.lower()}: they show where the value starts becoming behavior.',
        f'{name} is easier to recognize when it has verbs attached to it. The actions below give the value something observable to do.',
        f'These actions help translate {name.lower()} into a pattern someone could practice, notice, or name.',
        f'The verbs below are not synonyms for {name.lower()}; they are ways the value can show up in motion.',
    ]
    related_intros = [
        f'Values rarely move alone. These nearby values can support, sharpen, or complicate {name.lower()} in real life.',
        f'{name} often overlaps with other values. The links below show neighboring ideas that can clarify its edges.',
        f'These related values help place {name.lower()} in context, especially when one situation asks for several values at once.',
        f'Explore these nearby values when {name.lower()} feels connected to a wider pattern of choices, needs, or relationships.',
        f'These neighboring values can help distinguish {name.lower()} from similar instincts, habits, or commitments.',
        f'Use these related values as context when {name.lower()} feels close to another value but not quite the same.',
        f'The values below share some territory with {name.lower()}, while still pointing toward their own actions.',
        f'Follow these links when you want to see what tends to travel with {name.lower()} in real situations.',
    ]
    head_extra = value_structured_data(
        name=name,
        description=description,
        canonical_url=canonical_url,
        category=category,
        category_slug=category_slug,
        faq_items=content['faqs'],
    )

    body = f"""
<article class="value-page value-page--expanded">
  {breadcrumb_nav([('Home', '/'), ('Values', '/#dictionary-panel'), (category, f'/values/category/{category_slug}/'), (name, None)])}
  <h1>{html.escape(name)}</h1>
  <p class="meta"><strong>Category:</strong> <a href="/values/category/{category_slug}/">{html.escape(category)}</a></p>
  <p class="lede">{html.escape(description)}</p>
  <h2>Why this matters</h2>
  <p>{html.escape(content['why'])}</p>
  <h2>Examples in action</h2>
  <ul>{examples_markup}</ul>
  <h2>How to practice</h2>
  <ul>{practice_markup}</ul>
  <h2>Associated verbs</h2>
  <p>{html.escape(verb_intros[idx])}</p>
  <div>{tag_links}</div>
  <h2>Related values</h2>
  <p>{html.escape(related_intros[idx])}</p>
  <ul>{related_markup}</ul>
  <h2>Frequently asked questions</h2>
  <dl class="faq-list">{faq_markup}
  </dl>
</article>
"""
    return slug, html_page(title, meta_description, canonical_path, body, head_extra=head_extra)


def build_value_page(value: dict, values_by_tag: dict[str, list[dict]]) -> tuple[str, str]:
    slug = slugify(value['name'])
    related_values = related_values_for(value, values_by_tag)
    if slug in EXPANDED_VALUE_SLUGS:
        return build_expanded_value_page(value, values_by_tag, EXPANDED_VALUE_CONTENT[slug])
    return build_expanded_value_page(value, values_by_tag, build_generated_value_content(value, related_values))


def build_category_page(category: str, category_values: list[dict], categories: dict[str, list[dict]]) -> tuple[str, str]:
    slug = slugify(category)
    canonical_path = f'/values/category/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'
    sorted_values = sorted(category_values, key=lambda item: item['name'].lower())
    count = len(sorted_values)
    sample_names = ', '.join(item['name'] for item in sorted_values[:4])
    title = f'{category} Values Index | Howdy Human'
    desc = safe_excerpt(
        f'Browse {count} {category.lower()} values in the Howdy Human Dictionary of Values, including {sample_names}.'
    )

    value_links = ''.join(
        f'''
    <li>
      <a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a>
      <span>{html.escape(safe_excerpt(item.get("description", ""), 135))}</span>
    </li>'''
        for item in sorted_values
    )

    sibling_links = ''.join(
        f'<a class="chip" href="/values/category/{slugify(name)}/">{html.escape(name)} ({len(items)})</a>'
        for name, items in sorted(categories.items(), key=lambda pair: pair[0].lower())
        if name != category
    )

    structured_data = render_json_ld({
        '@context': 'https://schema.org',
        '@graph': [
            breadcrumb_schema([
                ('Home', f'{SITE_URL}/'),
                ('Values', f'{SITE_URL}/#dictionary-panel'),
                (category, canonical_url),
            ]),
            {
                '@type': 'CollectionPage',
                '@id': f'{canonical_url}#collection',
                'name': f'{category} Values',
                'description': desc,
                'url': canonical_url,
                'mainEntity': {
                    '@type': 'ItemList',
                    'numberOfItems': count,
                    'itemListElement': [
                        {
                            '@type': 'ListItem',
                            'position': index + 1,
                            'name': item['name'],
                            'url': f'{SITE_URL}/values/{slugify(item["name"])}/',
                        }
                        for index, item in enumerate(sorted_values)
                    ],
                },
            },
        ],
    })
    head_extra = f'  <script type="application/ld+json">\n{structured_data}\n  </script>'

    body = f"""
<article>
  {breadcrumb_nav([('Home', '/'), ('Values', '/#dictionary-panel'), (category, None)])}
  <h1>{html.escape(category)} Values</h1>
  <p>Browse values in the <strong>{html.escape(category)}</strong> category of the Howdy Human Dictionary of Values.</p>
  <p class=\"meta\">{count} value{'s' if count != 1 else ''} in this category</p>
  <h2>{html.escape(category)} value index</h2>
  <ul class=\"category-value-list\">{value_links}</ul>
  <h2>Explore other categories</h2>
  <div>{sibling_links}</div>
</article>
"""
    return slug, html_page(title, desc, canonical_path, body, head_extra=head_extra)


def build_verb_page(tag: str, values_for_tag: list[dict]) -> tuple[str, str]:
    slug = slugify(tag)
    canonical_path = f'/verbs/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'
    value_links = ''.join(
        f'<li><a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a> — {html.escape(safe_excerpt(item["description"], 120))}</li>'
        for item in sorted(values_for_tag, key=lambda v: v['name'])
    )
    count = len(values_for_tag)
    title = f"Values that embody '{tag}' | Howdy Human"
    desc = safe_excerpt(f"Discover {count} values connected to the verb '{tag}' in the Howdy Human Dictionary of Values.")
    structured_data = render_json_ld({
        '@context': 'https://schema.org',
        '@graph': [
            breadcrumb_schema([
                ('Home', f'{SITE_URL}/'),
                ('Verbs', f'{SITE_URL}/#dictionary-panel'),
                (tag, canonical_url),
            ]),
        ],
    })
    head_extra = f'  <script type="application/ld+json">\n{structured_data}\n  </script>'

    body = f"""
<article>
  {breadcrumb_nav([('Home', '/'), ('Verbs', '/#dictionary-panel'), (tag, None)])}
  <h1>Verb: {html.escape(tag)}</h1>
  <p>This page collects values that are commonly lived through the action <strong>{html.escape(tag)}</strong>.</p>
  <p class=\"meta\">{count} related value{'s' if count != 1 else ''}</p>
  <ul>{value_links}</ul>
</article>
"""
    return slug, html_page(title, desc, canonical_path, body, head_extra=head_extra, robots='noindex,follow')


def category_index_markup(categories: dict[str, list[dict]], heading_id: str = 'category-index-heading') -> str:
    cards = []
    for category, category_values in sorted(categories.items(), key=lambda pair: pair[0].lower()):
        sorted_values = sorted(category_values, key=lambda item: item['name'].lower())
        sample_links = ', '.join(
            f'<a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a>'
            for item in sorted_values[:4]
        )
        cards.append(f"""
                            <article class="seo-category-card">
                                <h3><a href="/values/category/{slugify(category)}/">{html.escape(category)}</a></h3>
                                <p class="meta">{len(sorted_values)} value{'s' if len(sorted_values) != 1 else ''}</p>
                                <p>{sample_links}</p>
                            </article>""")

    return f"""
                        <section class="seo-category-index" aria-labelledby="{html.escape(heading_id)}">
                            <h2 id="{html.escape(heading_id)}" class="text-2xl font-bold mt-8 mb-4 py-2 border-b border-gray-300 letter-section">Browse by category</h2>
                            <div class="seo-category-grid">{''.join(cards)}
                            </div>
                        </section>"""


def write_homepage_value_fallback(values: list[dict], categories: dict[str, list[dict]]) -> None:
    index_path = ROOT / 'index.html'
    page = index_path.read_text(encoding='utf-8')

    grouped: dict[str, list[dict]] = {}
    for value in sorted(values, key=lambda item: item['name'].lower()):
        letter = value['name'][0].upper()
        grouped.setdefault(letter, []).append(value)

    sections = []
    for letter, letter_values in grouped.items():
        cards = []
        for value in letter_values:
            name = value['name']
            slug = slugify(name)
            description = safe_excerpt(value.get('description', ''), 180)
            category = value.get('category', 'Uncategorized')
            cards.append(f"""
                            <article class="value-card p-4 rounded-md shadow-sm mb-4 seo-value-card">
                                <h3 class="text-xl font-bold mb-2">
                                    <a href="/values/{slug}/">{html.escape(name)}</a>
                                </h3>
                                <p class="meta"><strong>Category:</strong> {html.escape(category)}</p>
                                <p>{html.escape(description)}</p>
                            </article>""")

        sections.append(f"""
                        <section class="seo-letter-section" aria-labelledby="seo-section-{html.escape(letter)}">
                            <h2 id="seo-section-{html.escape(letter)}" class="text-2xl font-bold mt-8 mb-4 py-2 border-b border-gray-300 letter-section">{html.escape(letter)}</h2>
                            {''.join(cards)}
                        </section>""")

    category_index = '\n'.join([
        '<!-- SEO_CATEGORY_INDEX_START -->',
        category_index_markup(categories, 'homepage-category-index-heading'),
        '<!-- SEO_CATEGORY_INDEX_END -->',
    ])

    category_pattern = re.compile(
        r'<!-- SEO_CATEGORY_INDEX_START -->.*?<!-- SEO_CATEGORY_INDEX_END -->',
        re.DOTALL,
    )
    if category_pattern.search(page):
        page = category_pattern.sub(category_index, page)
    else:
        page = page.replace('<!-- Values List -->', f'{category_index}\n\n                    <!-- Values List -->')

    fallback = '\n'.join([
        '<!-- SEO_VALUE_FALLBACK_START -->',
        '<noscript><p>Browse the full Howdy Human Dictionary of Values below.</p></noscript>',
        *sections,
        '<!-- SEO_VALUE_FALLBACK_END -->',
    ])

    marker_pattern = re.compile(
        r'<!-- SEO_VALUE_FALLBACK_START -->.*?<!-- SEO_VALUE_FALLBACK_END -->',
        re.DOTALL,
    )
    if marker_pattern.search(page):
        page = marker_pattern.sub(fallback, page)
    else:
        page = page.replace('<!-- Values cards will be added here by JavaScript -->', fallback)

    page = '\n'.join(line.rstrip() for line in page.splitlines()) + '\n'
    index_path.write_text(page, encoding='utf-8')


def main() -> None:
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    values = data['values']

    values_dir = ROOT / 'values'
    categories_dir = values_dir / 'category'
    verbs_dir = ROOT / 'verbs'
    values_dir.mkdir(exist_ok=True)
    categories_dir.mkdir(parents=True, exist_ok=True)
    verbs_dir.mkdir(exist_ok=True)

    values_by_tag: dict[str, list[dict]] = {}
    values_by_category: dict[str, list[dict]] = {}
    for value in values:
        category = value.get('category') or 'Uncategorized'
        values_by_category.setdefault(category, []).append(value)
        for tag in value.get('tags', []):
            if not tag:
                continue
            values_by_tag.setdefault(tag, []).append(value)

    value_slugs = {slugify(value['name']) for value in values}
    category_slugs = {slugify(category) for category in values_by_category}
    verb_slugs = {slugify(tag) for tag in values_by_tag}

    ensure_clean_directory(values_dir, value_slugs)
    categories_dir.mkdir(parents=True, exist_ok=True)
    ensure_clean_directory(categories_dir, category_slugs)
    ensure_clean_directory(verbs_dir, verb_slugs)

    for value in values:
        slug, page = build_value_page(value, values_by_tag)
        out_dir = values_dir / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / 'index.html').write_text(page, encoding='utf-8')

    for category, category_values in values_by_category.items():
        slug, page = build_category_page(category, category_values, values_by_category)
        out_dir = categories_dir / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / 'index.html').write_text(page, encoding='utf-8')

    for tag, tagged_values in values_by_tag.items():
        slug, page = build_verb_page(tag, tagged_values)
        out_dir = verbs_dir / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / 'index.html').write_text(page, encoding='utf-8')

    write_sitemap(sorted(value_slugs), sorted(category_slugs))
    write_homepage_value_fallback(values, values_by_category)

    print(
        f'Generated {len(values)} value pages, {len(values_by_category)} category pages, {len(values_by_tag)} verb pages, '
        f'refreshed sitemap.xml, and updated homepage fallback links.'
    )


if __name__ == '__main__':
    main()
