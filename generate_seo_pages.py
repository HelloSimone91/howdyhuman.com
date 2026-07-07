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


EDITORIAL_REPLACEMENT_VALUE_CONTENT = {
    'capitalism': {
        'replace_source_example': True,
        'why': (
            'Capitalism matters as a values question because markets are never just math; they are made of choices '
            'about ownership, risk, labor, prices, access, and responsibility. Left abstract, capitalism can sound like '
            'a system someone either praises or rejects from a distance. In practice, it asks what a person will build, '
            'invest in, compete for, grow, and own without forgetting who is affected by the exchange. The Howdy Human '
            'question is not "Do you believe in capitalism?" but "What kind of human behavior does your market choice '
            'reward?"'
        ),
        'examples': [
            'A bakery owner practices capitalism with care when she raises prices to keep the shop solvent, explains the change plainly, pays staff for prep time, and refuses a cheaper supplier whose labor practices violate her standards.',
            'A freelancer practices capitalism by setting a rate that supports rent, taxes, and rest instead of underpricing the work to avoid an uncomfortable money conversation.',
            'A customer practices capitalism by choosing where to spend, what to buy secondhand, and which businesses deserve repeat support.',
        ],
        'practice': [
            'Before you buy, build, invest, or sell, name who benefits and who carries the cost.',
            'Check whether competition is making the work better or just making people easier to ignore.',
            'Own the tradeoff in one sentence instead of hiding behind "that is just business."',
            'Choose one market action this week that better matches your stated values: pricing, sourcing, tipping, hiring, saving, or spending.',
            'Ask whether growth is increasing dignity, usefulness, and sustainability, or only increasing extraction.',
        ],
        'faqs': [
            (
                'What does capitalism mean as a value?',
                'Capitalism as a value lens means paying attention to how ownership, investment, competition, and exchange shape human behavior. It becomes useful when market choices are judged by what they reward and protect.',
            ),
            (
                'How do I practice capitalism responsibly?',
                'Practice capitalism responsibly by making the tradeoffs visible: price honestly, pay fairly, buy intentionally, invest carefully, compete without dehumanizing people, and notice who carries the hidden cost.',
            ),
            (
                'Why include capitalism in a values dictionary?',
                'Capitalism belongs here because many everyday choices happen inside markets. The page is strongest when it treats capitalism as a behavior-shaping system, not as a slogan.',
            ),
        ],
    },
    'money': {
        'replace_source_example': True,
        'why': (
            'Money matters because it turns invisible priorities into visible patterns. It can buy goods and services, '
            'but it also reveals what someone protects, postpones, avoids, funds, earns, invests, manages, and shares. '
            'Money is not the whole story of a life, and it is not neutral either. A budget, a rate, a debt payment, a '
            'gift, or a refusal can show what a person is practicing. Howdy Human treats money as a verb map for care, '
            'security, power, freedom, repair, and responsibility.'
        ),
        'examples': [
            'A teacher with a tight paycheck practices money by setting aside twenty dollars for a medical bill, saying no to a weekend plan, and telling a friend the truth instead of pretending the choice is casual.',
            'A founder practices money by building a budget that pays contractors on time before buying prettier brand assets.',
            'A parent practices money by explaining a family spending limit without shame, then choosing one low-cost ritual that still feels generous.',
        ],
        'practice': [
            'Look at one week of spending and name the values already being funded.',
            'Choose one money verb for today: earn, save, invest, budget, give, pay, reduce, or repair.',
            'Say the money truth plainly before resentment or secrecy does the talking.',
            'Make one small allocation that protects a future need instead of only soothing a current feeling.',
            'Ask whether the next purchase, rate, or payment increases freedom, care, or avoidance.',
        ],
        'faqs': [
            (
                'What does money mean as a value?',
                'Money as a value lens means noticing how earning, spending, saving, investing, and sharing reveal priorities. It is a tool, but the way people use it becomes behavior.',
            ),
            (
                'How do I practice money as a value?',
                'Practice money by making one financial choice more honest and intentional: budget the real number, pay someone fairly, name a limit, save for a need, or spend in line with what matters.',
            ),
            (
                'Is money itself a value?',
                'Money is more accurately a tool that exposes values. It deserves a page because money choices often show what people protect, fear, desire, and make possible.',
            ),
        ],
    },
    'luxury': {
        'replace_source_example': True,
        'why': (
            'Luxury matters when it is understood as chosen comfort, beauty, and attention rather than status for its '
            'own sake. At its worst, luxury can become proof that someone has enough money to be insulated from other '
            'people. At its best, it asks what it means to savor, enjoy, appreciate, and design an experience with '
            'care. The Howdy Human version of luxury is not "more expensive"; it is "more considered." It should make '
            'life feel more human, not make anyone smaller.'
        ),
        'examples': [
            'A caregiver practices luxury by taking twenty quiet minutes with clean sheets, a favorite lotion, and a locked bathroom door after a week of being needed by everyone.',
            'A host practices luxury by serving a simple meal on real plates, dimming the lights, and letting guests feel unrushed instead of trying to impress them.',
            'A shopper practices luxury by buying one well-made used coat they will care for, rather than three cheap versions that will fall apart.',
        ],
        'practice': [
            'Define luxury today as one detail that increases comfort, beauty, or ease without creating waste or debt.',
            'Savor something you already have before acquiring something new.',
            'Ask whether the elegant choice also respects time, labor, materials, and future cleanup.',
            'Design one ordinary moment so your body can feel cared for: a meal, bath, walk, outfit, or bedtime.',
            'Notice when luxury is becoming performance, then return to what would actually feel nourishing.',
        ],
        'faqs': [
            (
                'What does luxury mean as a value?',
                'Luxury as a value means honoring comfort, beauty, craft, and sensory care in intentional ways. It becomes human when it creates ease without turning status into the point.',
            ),
            (
                'How do I practice luxury without overconsuming?',
                'Practice luxury by savoring what is already present, choosing quality over quantity, caring for materials, and designing small moments of comfort rather than chasing constant acquisition.',
            ),
            (
                'Can luxury be ethical?',
                'Luxury can be more ethical when it respects labor, sustainability, access, and enoughness. The question is whether the pleasure depends on hidden harm or thoughtful care.',
            ),
        ],
    },
    'sports': {
        'replace_source_example': True,
        'why': (
            'Sports matter here because physical skill, competition, and team play make values visible under pressure. '
            'A scoreboard can reveal discipline, teamwork, courage, humility, fairness, and self-control faster than a '
            'speech about character. Sports are not automatically virtuous; they can also reward ego, aggression, '
            'exclusion, or winning at any cost. The Howdy Human question is whether the game is helping people become '
            'more honest, skillful, connected, and brave. The '
            'value appears in how people play, compete, train, practice, participate, lose, and repair after the whistle.'
        ),
        'examples': [
            'A teenage captain practices sports as a value when she tells the referee the ball touched her last, even though the honest call gives possession to the other team in the final minute.',
            'A coach practices sports by benching a talented player who keeps humiliating teammates during drills.',
            'A parent practices sports by praising effort, recovery, and teamwork instead of turning every car ride home into a performance review.',
        ],
        'practice': [
            'Choose the value inside the game before the game starts: fairness, teamwork, discipline, courage, joy, or respect.',
            'Compete hard without making the other person less human.',
            'Train one skill that helps the team, not only the skill that gets applause.',
            'After a loss, name one thing to learn before assigning blame.',
            'Watch whether participation is building confidence and connection or just feeding pressure.',
        ],
        'faqs': [
            (
                'What do sports mean as a value?',
                'Sports become a value lens when play, competition, training, and teamwork reveal character. The value is not the activity alone, but the behavior people practice through it.',
            ),
            (
                'How do I practice sports as a value?',
                'Practice sports by competing with respect, training consistently, including teammates, learning from loss, and caring about how the game shapes people as much as the result.',
            ),
            (
                'Are sports really a value?',
                'Sports are more of a domain than a single value, but they belong here when they help people practice values like discipline, teamwork, fairness, courage, and joy.',
            ),
        ],
    },
    'technology': {
        'replace_source_example': True,
        'why': (
            'Technology matters because tools quietly train behavior. The same tool can help someone develop, utilize, '
            'apply, create, learn, connect, monitor, distract, exclude, or control. Technology as a value is not about loving devices; it is '
            'about choosing how knowledge and tools are used to solve real problems without making people less free, '
            'less capable, or less seen. Howdy Human asks: what does this tool help humans do, and what does it teach '
            'them to stop doing?'
        ),
        'examples': [
            'A clinic practices technology well when it adds text reminders that help patients make appointments, while keeping a phone option for people who cannot use the portal.',
            'A teacher practices technology by using a shared document to help quiet students contribute without turning every class moment into screen time.',
            'A designer practices technology by removing a manipulative notification that increases clicks but worsens attention.',
        ],
        'practice': [
            'Name the human problem before choosing the tool.',
            'Ask what the technology helps people do, and what it may make harder to notice.',
            'Use, build, or recommend tools that increase access instead of quietly excluding people.',
            'Check whether automation is removing drudgery or removing accountability.',
            'Set one boundary where a tool is no longer serving the human purpose.',
        ],
        'faqs': [
            (
                'What does technology mean as a value?',
                'Technology as a value means using tools and knowledge to solve problems, increase access, and support human capability. It becomes visible in how tools shape behavior.',
            ),
            (
                'How do I practice technology intentionally?',
                'Practice technology intentionally by starting with the human need, choosing the simplest useful tool, protecting access, and checking whether the tool is serving attention, dignity, and agency.',
            ),
            (
                'Why is technology not automatically progress?',
                'Technology is only progress when it improves real human conditions. A tool can be new and still make people more distracted, excluded, surveilled, or dependent.',
            ),
        ],
    },
    'fine-art': {
        'replace_source_example': True,
        'why': (
            'Fine art matters because human beings need more than efficient communication. Art can create, compose, '
            'express, craft, and design a way of seeing that ordinary language cannot reach by itself. It can hold grief, '
            'beauty, protest, memory, awe, and contradiction without rushing to solve them. The Howdy Human point is '
            'not that art is fancy; it is that making and witnessing art can return attention to what a culture might '
            'otherwise flatten.'
        ),
        'examples': [
            'A painter practices fine art by making a portrait series of longtime neighborhood residents before redevelopment erases the visual memory of who lived there.',
            'A museum educator practices fine art by helping children describe what they notice in a sculpture before telling them what it is supposed to mean.',
            'A grieving person practices fine art by composing a small collage with old receipts, photos, and handwriting when ordinary sentences feel too thin.',
        ],
        'practice': [
            'Spend five minutes observing one artwork before deciding whether you like it.',
            'Create something that expresses a feeling you keep overexplaining.',
            'Ask what the form makes possible: color, scale, silence, texture, image, repetition, or contrast.',
            'Support art that preserves memory, questions power, or makes beauty available.',
            'Let the artwork complicate your first interpretation instead of forcing it to become a quick lesson.',
        ],
        'faqs': [
            (
                'What does fine art mean as a value?',
                'Fine art as a value means honoring creative work that expresses beauty, emotion, memory, critique, and perception. It becomes a practice through creating, witnessing, preserving, and interpreting art.',
            ),
            (
                'How do I practice fine art as a value?',
                'Practice fine art by making work, studying work, supporting artists, observing carefully, and letting images or forms help you understand something language alone cannot hold.',
            ),
            (
                'Is fine art only for artists?',
                'No. Artists practice fine art by making it, but anyone can practice the value by witnessing, preserving, funding, discussing, and learning from creative work with serious attention.',
            ),
        ],
    },
    'synergy': {
        'replace_source_example': True,
        'why': (
            'Synergy matters only when it stops sounding like a meeting word and starts describing a real shared result. '
            'It is the moment people combine, unite, integrate, collaborate, and coordinate so the work becomes wiser '
            'than any one person could have made alone. The Howdy Human version of synergy has names, roles, handoffs, '
            'and a result someone can point to. Synergy is not forced agreement or everyone being cheerful. It '
            'requires honest difference, clear roles, trust, and enough humility to let the best idea belong to the group.'
        ),
        'examples': [
            'A nurse, social worker, and housing advocate create synergy when they coordinate discharge care so a patient leaves the hospital with medicine, transportation, and a safe place to sleep.',
            'Two artists create synergy when one brings structure, the other brings texture, and both revise the piece until neither person can claim the strongest part alone.',
            'A team fails at synergy when everyone attends the meeting, but nobody integrates the work after leaving it.',
        ],
        'practice': [
            'Name the shared outcome before defending your preferred method.',
            'Ask what each person sees that the others might miss.',
            'Combine roles on purpose: who clarifies, who builds, who tests, who notices people, who carries details?',
            'Coordinate the handoff so collaboration does not become duplicated labor.',
            'Check whether the final result is actually stronger, or only more crowded.',
        ],
        'faqs': [
            (
                'What does synergy mean as a value?',
                'Synergy means people combining their strengths so the result is better than what they could create separately. It becomes real through coordination, integration, trust, and shared ownership.',
            ),
            (
                'How do I practice synergy?',
                'Practice synergy by clarifying the shared outcome, inviting different strengths, coordinating responsibilities, integrating feedback, and checking whether the combined work truly improved the result.',
            ),
            (
                'Why can synergy sound awkward?',
                'Synergy sounds awkward when it is used as corporate decoration. It becomes useful when the page shows a concrete collaboration with roles, stakes, and a better shared outcome.',
            ),
        ],
    },
    'ambiguity': {
        'replace_source_example': True,
        'why': (
            'Ambiguity matters because not every important situation becomes clear on command. Some moments ask a '
            'person to interpret, question, consider, and explore before rushing to certainty. Ambiguity is not the '
            'same as confusion for its own sake; it is the willingness to stay honest when more than one meaning may be '
            'true. The Howdy Human practice is learning how to remain thoughtful before the story hardens.'
        ),
        'examples': [
            'A manager practices ambiguity when two employees describe the same conflict differently, and she slows down enough to hear both accounts before deciding what repair is needed.',
            'A friend practices ambiguity by saying, "I may be reading this wrong. Can you tell me what you meant?" instead of reacting to the first interpretation.',
            'A researcher practices ambiguity by keeping an unexpected result in the data set long enough to learn from it.',
        ],
        'practice': [
            'When you feel certain too quickly, ask what else could be true.',
            'Separate the facts, the interpretation, and the fear.',
            'Use one clarifying question before you make the meaning final.',
            'Stay with the unclear part long enough to gather better evidence.',
            'Notice when ambiguity is useful curiosity and when it has become avoidance of a needed decision.',
        ],
        'faqs': [
            (
                'What does ambiguity mean as a value?',
                'Ambiguity as a value means staying open when a situation has more than one possible meaning. It supports thoughtful interpretation, inquiry, and patience before certainty.',
            ),
            (
                'How do I practice ambiguity?',
                'Practice ambiguity by pausing before deciding, asking clarifying questions, naming multiple possible interpretations, and gathering enough information to act wisely.',
            ),
            (
                'Is ambiguity the same as indecision?',
                'No. Ambiguity can help people think carefully before acting. Indecision becomes a problem when openness turns into avoiding a choice that needs to be made.',
            ),
        ],
    },
    'action': {
        'replace_source_example': True,
        'why': (
            'Action matters because a value that never moves is only decoration. Taking steps, performing the next task, '
            'executing the plan, and implementing the repair are how intentions become visible. Action does not mean '
            'constant motion or productivity for its own sake. It means choosing the next honest behavior when the idea '
            'has been clear long enough. In Howdy Human language, action is where a value gets legs.'
        ),
        'examples': [
            'After months of saying the community pantry matters, a neighbor practices action by calling the school, reserving a table, recruiting two volunteers, and buying the first bins.',
            'A student practices action by opening the document and writing the bad first paragraph instead of researching for another hour.',
            'A partner practices action by scheduling the counseling appointment they both agreed was needed.',
        ],
        'practice': [
            'Write the next visible step as a verb: call, send, ask, repair, schedule, clean, draft, or decide.',
            'Make the action small enough to complete before your motivation changes its mind.',
            'Stop using preparation as a hiding place once the next step is known.',
            'After acting, ask what changed in the room, the relationship, the plan, or your body.',
            'Choose action that serves a value, not motion that only proves you are busy.',
        ],
        'faqs': [
            (
                'What does action mean as a value?',
                'Action means taking concrete steps that make intention visible. As a value, it connects beliefs, plans, and care to behavior people can observe.',
            ),
            (
                'How do I practice action?',
                'Practice action by choosing one clear next step, making it small enough to finish, and doing it before overplanning becomes avoidance.',
            ),
            (
                'Is action always better than reflection?',
                'No. Reflection helps choose the right move. Action matters when reflection has already shown the next honest step and delay is keeping the value theoretical.',
            ),
        ],
    },
    'impact': {
        'replace_source_example': True,
        'why': (
            'Impact matters because good intentions are not the same as a positive difference in people\'s lives or the '
            'world around us. Impact asks what actually happened because someone chose to influence, change, transform, '
            'shape, or alter something. It needs '
            'humility because a person can mean well and still make the wrong thing louder. The Howdy Human question is: '
            'who is better supported, safer, freer, clearer, or more resourced because this action occurred?'
        ),
        'examples': [
            'A nonprofit director practices impact by canceling a popular workshop after participant feedback shows the emergency cash fund is doing more to stabilize families.',
            'A teacher practices impact by changing a grading policy after realizing the old system rewarded quiet privilege more than learning.',
            'A designer practices impact by measuring whether a form is actually easier for older adults to complete, not just whether it looks cleaner.',
        ],
        'practice': [
            'Name the change you hope to make before choosing the activity.',
            'Ask the people affected whether the help is helping.',
            'Measure one real outcome, not only effort, reach, or applause.',
            'Look for unintended effects, especially on people with less power in the situation.',
            'Let evidence change the plan when the original idea is not creating the needed result.',
        ],
        'faqs': [
            (
                'What does impact mean as a value?',
                'Impact means making a real difference in people, systems, or conditions. As a value, it asks whether an action actually changed something that mattered.',
            ),
            (
                'How do I practice impact?',
                'Practice impact by naming the change you want, listening to affected people, measuring real outcomes, and adjusting when the effort is not producing useful change.',
            ),
            (
                'How is impact different from intention?',
                'Intention is what someone means to do. Impact is what actually happens because of the action. Values become more trustworthy when both are examined.',
            ),
        ],
    },
    'mission': {
        'replace_source_example': True,
        'why': (
            'Mission matters because purpose needs a direction that can survive distraction. A mission helps a person or '
            'group pursue, fulfill, accomplish, achieve, and drive work that would otherwise scatter. It is not a slogan '
            'for a website footer. A real mission helps you decide what to do, what to stop doing, and what cost you are '
            'willing to carry. Howdy Human treats mission as purpose with assignments.'
        ),
        'examples': [
            'A mutual aid group practices mission when it turns down a flashy fundraiser because the planning time would pull volunteers away from weekly grocery deliveries.',
            'A creative director practices mission by choosing the children\'s literacy project over a better-paid campaign that does not fit the studio promise.',
            'A family practices mission by deciding that Sunday dinner is protected time because connection needs a recurring structure.',
        ],
        'practice': [
            'Write the mission as one sentence with a person, action, and reason.',
            'Use the mission to say no to one good-looking distraction.',
            'Ask what needs to be pursued this week for the mission to stay alive.',
            'Check whether the mission is guiding real choices or only decorating them.',
            'Name the cost honestly: time, money, attention, comfort, status, or speed.',
        ],
        'faqs': [
            (
                'What does mission mean as a value?',
                'Mission means a guiding purpose that directs action. As a value, it helps people pursue meaningful work, make decisions, and stay aligned under pressure.',
            ),
            (
                'How do I practice mission?',
                'Practice mission by naming the work, choosing actions that serve it, saying no to distractions, and checking whether daily choices still match the stated purpose.',
            ),
            (
                'How is mission different from purpose?',
                'Purpose names the deeper why. Mission turns that why into direction, commitments, and repeated choices that can be acted on with other people.',
            ),
        ],
    },
    'representation': {
        'replace_source_example': True,
        'why': (
            'Representation matters because people notice who is pictured, who is invited, who speaks, who is missing, '
            'and who only appears as a stereotype. It is not just visibility; it is whether people, stories, and '
            'communities are included, reflected, advocated for, and depicted with enough truth to preserve dignity. '
            'Howdy Human treats representation as a responsibility: do not use someone\'s image, pain, culture, or story '
            'as decoration for a room they still cannot enter.'
        ),
        'examples': [
            'A curriculum team practices representation by replacing a token heritage-month slide with books by living authors, local history, and classroom discussion that lets students speak from more than one identity.',
            'A brand team practices representation by paying community advisors before using their stories in a campaign.',
            'A meeting facilitator practices representation by noticing whose expertise is being summarized by others and making room for that person to speak directly.',
        ],
        'practice': [
            'Ask who is present, who is missing, and who has decision-making power.',
            'Include people early enough that they can shape the work, not merely approve it.',
            'Represent lived experience with specificity instead of relying on symbols or stereotypes.',
            'Pay, credit, and protect the people whose stories make the work stronger.',
            'Check whether visibility is connected to access, influence, and dignity.',
        ],
        'faqs': [
            (
                'What does representation mean as a value?',
                'Representation means people, groups, and experiences are shown, included, and spoken for with truth and dignity. It becomes a value when visibility is connected to voice and power.',
            ),
            (
                'How do I practice representation?',
                'Practice representation by including affected people early, listening to their expertise, avoiding stereotypes, sharing credit, and making sure visibility leads to real access or influence.',
            ),
            (
                'Why is representation more than visibility?',
                'Visibility can still be shallow or extractive. Representation asks whether people have voice, context, dignity, and power in how their stories or identities appear.',
            ),
        ],
    },
    'charisma': {
        'replace_source_example': True,
        'why': (
            'Charisma matters because attention is a form of power. The ability to attract, influence, inspire, and '
            'engage people can open rooms, build trust, and give courage to a group. It can also manipulate, overwhelm, '
            'or make the room orbit one person. Charisma becomes a value only when charm serves connection instead of '
            'control. The Howdy Human test is whether people leave your presence more themselves, not just more impressed.'
        ),
        'examples': [
            'A youth mentor practices charisma well when students listen because she is warm and vivid, then she uses that attention to help quieter kids trust their own voices.',
            'A founder misuses charisma when every meeting ends with applause for the vision but no clear consent, budget, or follow-through.',
            'A host practices charisma by noticing who has not spoken and turning the spotlight into an invitation.',
        ],
        'practice': [
            'Use attention to create room for others, not only to hold the room yourself.',
            'Check whether your influence leaves people clearer or just swept up.',
            'Ask before turning someone else into part of your story or performance.',
            'Balance charm with follow-through; inspiration without reliability becomes noise.',
            'Notice whether people feel free to disagree with you after being inspired by you.',
        ],
        'faqs': [
            (
                'What does charisma mean as a value?',
                'Charisma means the ability to attract, engage, and influence others. It becomes a value when that influence supports connection, courage, clarity, and shared agency.',
            ),
            (
                'How do I practice charisma responsibly?',
                'Practice charisma responsibly by using attention to include others, inspire honest action, respect consent, and follow through after the energetic moment has passed.',
            ),
            (
                'Can charisma become harmful?',
                'Yes. Charisma becomes harmful when charm replaces truth, consent, accountability, or shared power. Influence needs responsibility to become trustworthy.',
            ),
        ],
    },
    'sovereignty': {
        'replace_source_example': True,
        'why': (
            'Sovereignty matters because self-rule is a dignity issue. For a country, community, group, or person, it '
            'asks who gets to determine, decide, govern, direct, and protect the choices that shape a life. Sovereignty '
            'is not isolation or never being accountable. It is the right to participate in decisions that affect your '
            'body, culture, home, resources, and future. Howdy Human treats sovereignty as power with boundaries and '
            'responsibility.'
        ),
        'examples': [
            'A tribal council practices sovereignty when it sets its own child welfare priorities and requires outside agencies to respect community process instead of imposing a generic solution.',
            'A patient practices personal sovereignty by asking for the risks, alternatives, and time to decide before consenting to a procedure.',
            'A neighborhood practices sovereignty when residents organize around land use because development decisions will reshape their daily lives.',
        ],
        'practice': [
            'Ask who has authority to decide, and who is living with the consequences.',
            'Protect consent where bodies, homes, stories, land, or culture are involved.',
            'Distinguish autonomy from avoidance; self-rule still needs relationship and responsibility.',
            'Make the decision process visible before the decision is finalized.',
            'Support groups in defining their own needs instead of speaking over them.',
        ],
        'faqs': [
            (
                'What does sovereignty mean as a value?',
                'Sovereignty means the ability of a person, group, or nation to govern itself and make decisions about its own life, resources, body, or future.',
            ),
            (
                'How do I practice sovereignty?',
                'Practice sovereignty by respecting consent, honoring self-determination, clarifying who has decision-making power, and supporting people or communities in naming their own needs.',
            ),
            (
                'Is sovereignty the same as independence?',
                'Not exactly. Independence emphasizes freedom from control. Sovereignty emphasizes legitimate self-rule, decision-making authority, and responsibility within real relationships and systems.',
            ),
        ],
    },
    'piety': {
        'replace_source_example': True,
        'why': (
            'Piety matters when devotion becomes careful practice instead of public performance. For some people, piety '
            'is religious reverence; for others, it is a deep respect for what they hold sacred. It can ask a person to '
            'practice, observe, follow, honor, respect, and return to commitments that are bigger than appetite or mood. '
            'The Howdy Human question is whether devotion makes someone more humble, more honest, and more loving in the '
            'ordinary room they are standing in.'
        ),
        'examples': [
            'A woman practices piety by leaving a tense work lunch to pray quietly, then returning with enough humility to apologize for the comment she made before she left.',
            'A son practices piety by observing a family mourning ritual with sincerity, even though his beliefs have changed, because the ritual honors love and memory.',
            'A community leader fails at piety when sacred language is used to avoid accountability for harm.',
        ],
        'practice': [
            'Name what you hold sacred before deciding what practice should protect it.',
            'Let devotion change how you treat people, not only how you describe yourself.',
            'Observe a ritual with attention instead of rushing through it as proof of identity.',
            'Respect the line between sincere practice and performing holiness for approval.',
            'Ask whether the sacred commitment is making you more accountable, compassionate, and truthful.',
        ],
        'faqs': [
            (
                'What does piety mean as a value?',
                'Piety means deep reverence or devotion toward what is sacred, holy, or deeply honored. As a value, it becomes visible through respectful practice and humility.',
            ),
            (
                'How do I practice piety?',
                'Practice piety by honoring what you hold sacred through steady actions, rituals, respect, service, humility, and accountability in ordinary life.',
            ),
            (
                'Is piety only religious?',
                'Piety is often religious, but the broader value can include reverence for sacred commitments, ancestors, community, truth, or practices that deserve deep respect.',
            ),
        ],
    },
    'professionalism': {
        'replace_source_example': True,
        'why': (
            'Professionalism matters because work is still a human environment. It is not about sounding stiff or hiding '
            'your personality behind corporate manners. Professionalism asks people to maintain respect, demonstrate '
            'care, uphold agreements, practice competence, and exhibit steadiness when other people are depending on the '
            'work. Howdy Human treats professionalism as reliability with dignity, not polish without a pulse.'
        ),
        'examples': [
            'A hair stylist practices professionalism when a client arrives upset and late, and she stays kind, names the time boundary, adjusts what is possible, and still does careful work.',
            'A consultant practices professionalism by admitting a missed detail before the client finds it and bringing a corrected timeline.',
            'A coworker practices professionalism by disagreeing clearly in the meeting without embarrassing the person who made the original proposal.',
        ],
        'practice': [
            'Make the expectation clear before frustration has to carry the message.',
            'Follow through on the small promises that make people feel safe working with you.',
            'Use respectful language without hiding the actual issue.',
            'Own mistakes early and bring the next useful step.',
            'Check whether your presence helps the work feel steadier, clearer, and more humane.',
        ],
        'faqs': [
            (
                'What does professionalism mean as a value?',
                'Professionalism means showing respect, responsibility, competence, and steadiness in work settings. It becomes a value when reliability and dignity shape how the work gets done.',
            ),
            (
                'How do I practice professionalism?',
                'Practice professionalism by communicating clearly, keeping agreements, respecting time, owning mistakes, doing careful work, and treating people with dignity under pressure.',
            ),
            (
                'Is professionalism the same as being formal?',
                'No. Formality is a style. Professionalism is a pattern of respect, competence, accountability, and follow-through that can still feel warm and human.',
            ),
        ],
    },
    'effectiveness': {
        'replace_source_example': True,
        'why': (
            'Effectiveness matters because effort is not the same as usefulness. A person can work hard, care deeply, '
            'and still avoid the action that would actually deliver the needed result. Effectiveness asks people to '
            'achieve, produce, accomplish, execute, and adjust with the outcome in mind. It is not cold efficiency; it '
            'is respect for the real need. The Howdy Human question is: did this help, or did it only look like helping?'
        ),
        'examples': [
            'A volunteer coordinator practices effectiveness by replacing a long inspirational meeting with a ten-minute briefing, a clear packing list, and enough drivers to get supplies delivered before dark.',
            'A therapist practices effectiveness by changing the homework when a client repeatedly cannot do it, instead of treating the missed assignment as the whole problem.',
            'A team practices effectiveness by stopping a beloved program after data shows a simpler service reaches the people who need it most.',
        ],
        'practice': [
            'Name the result that would prove the effort helped.',
            'Choose the action most likely to produce that result, even if it is less impressive.',
            'Ask what can be simplified, delegated, stopped, or measured.',
            'Check whether the people affected experience the work as useful.',
            'Adjust quickly when the current method is producing activity instead of impact.',
        ],
        'faqs': [
            (
                'What does effectiveness mean as a value?',
                'Effectiveness means producing useful results, not just effort. As a value, it connects care, skill, and action to outcomes that actually help.',
            ),
            (
                'How do I practice effectiveness?',
                'Practice effectiveness by naming the desired result, choosing actions that serve it, measuring whether the work helped, and adjusting when effort is not producing the needed outcome.',
            ),
            (
                'Is effectiveness the same as efficiency?',
                'No. Efficiency is about using fewer resources. Effectiveness is about whether the action works. The most effective choice may not always be the fastest one.',
            ),
        ],
    },
}

EXPANDED_VALUE_CONTENT.update(EDITORIAL_REPLACEMENT_VALUE_CONTENT)
EXPANDED_VALUE_SLUGS.update(EDITORIAL_REPLACEMENT_VALUE_CONTENT)
REPLACE_SOURCE_EXAMPLE_SLUGS = {
    slug
    for slug, content in EDITORIAL_REPLACEMENT_VALUE_CONTENT.items()
    if content.get('replace_source_example')
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
    urls = [f'{SITE_URL}/']
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
    if slug in REPLACE_SOURCE_EXAMPLE_SLUGS:
        examples = content['examples'][:3]
    else:
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
