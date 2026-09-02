# (Not) AI Training

## Slide 1 — AI Show Case

I need some really cool AI things to show that I can do with Microsoft Copilot. Maybe make an interactive one-page web app?

But how the hell does it do it?

So there are two explanations.

1. Here are LLMs, embeddings, KV caches, all the maths equations, vectors, tensor multiplications, attention heads, and so on.
   BUT I think if I went through this, in about 5 minutes all of you would have left the meeting, and the few staying are nerds like me, or aren't actually in the room anymore.
2. So let's go the other path. And actually the maths and science is actually pretty cool, but when I went down this second path, learning about AI made me learn about me — who I am, and how I work. And the better I got at getting to know me, the better I used AI, and the better results I got.

## Slide 2 — "Ideas in Space" (The Map)

Our brain has different ideas in different places.

Visualise in space — a 2D map of ideas together, showing the direction of similar topics. Showing that you can draw a circle around similar ideas.

And we can describe these ideas in sentences.

And sentences are made up of words.

Tokenisation — so we can break up sentences into words or tokens (technically words can be broken up into parts as well, but for the purposes of today, tokens = words. If you are angry at me for this "simplification", come and chat to me afterwards and we can nerd out.)

Show the Glossary — Token (is the only one on the page).

So we can see our sentences be broken up, but then fade away the filler words (the, a, etc.).

And we have the verb, noun, adjectives, and the meaning of these is all connected.

## Slide 3 — The Meaning of Words → Introduce: Context

Show glossary slide: 🧩 Token — a chunk of text. A word.

The meaning of a word comes from the words that came before.

- A fashion model
- A machine learning model

Need a few more examples that lay people would understand.

And as we start thinking about words, we start realising — hey, words are similar to each other.

Show the Glossary — add C.

## Slide 4 — The Glossary: Token

- 🧩 Token — a chunk of text. A word.

## Slide 5 — Word Association Game → Introduce: Vector

Trying to give them the idea of vector directions without saying it. I say the first, then put up sister > ????. And as I go through, we have all these examples:

- girl > boy
- sister > brother
- Japan > sushi
- Australia > Bunnings sausage
- France > Paris
- Italy > Rome
- copper > Cu
- zinc > Zn
- Victoria > Melbourne
- New South Wales > Sydney

And this is where we jump back to the "map of ideas" and show that, hey, all these things were already in the map. And I put the map of ideas up and go, hey, with an arrow between all these things — look, they're all in a similar direction from the first word to the second.

And we do a backwards one — we do ? < Rome and see if they can go backwards.

A maths equation: x + 5 = 7.

So ideas go in both directions!!!!!

And this is just maths — a direction, and a distance. (Vector)

Directionality:

- girl > boy
- girl ^ mother
- boy ^ father

🧭 Vector — a direction and a distance. Similar words (or ideas) point the same way.

## Slide 6 — The Glossary: Vector

- 🧩 Token — a chunk of text. A word.
- 🧭 Vector — a direction and a distance. Similar words (or ideas) point the same way.

## Slide 7 — Context (With Pictures)

What animal would you find here?

Show them pictures and show how their brains get context from the picture:

- House, family, 2 kids = Dog
- A chicken coop (no chickens would be in the photo) = Chickens
- Horse racing track = Horse

## Slide 8 — Context (With Words)

We keep adding words to guess who the person is. We're trying to show that exactly the same prompt, but with different context, is going to get a totally different answer.

So if we now link back together the idea that we have these two ideas: words have meaning, and the words that came before give future words meaning; and the second, we all bring context to the table when we make decisions. AI works exactly the same.

This is where I drop... so you keep going — AI, look at this computer, look at what it does. A matrix, code flying in on the screen.

But let's step back. AI expands to "Artificial Intelligence" on the page. Put a strike-through on "artificial" on the screen, and then "artificial" disappears and "intelligence" takes the centre.

This is just intelligence, just done by a computer. It thinks exactly like we do.

In the past, computers were made with programming. AI is made to replicate our brains.

This is where we can put the neurons. Neuron activation in a brain vs. the dials and activations in a neural network image.

We trained our brain at school, and through life experience — reading a whole bunch of information, listening to our teachers and getting feedback when we got it right or wrong, and then our teachers/managers saying "oh, this draft is good" or "this one could be better." And our brain changed over time.

This is how AI is trained: give it a whole bunch of information, and its brain changes over time. And then we go to it: "hey, this is good" or "this could be better," until it develops to where it is now. (Later on I'll link back to this — an area where different models have different purposes, different quirks.)

🎛️ Weight — a dial. How strongly two tokens are connected.

🧠 Model — all the dial positions together. The complete knowledge.

## Slide 9 — The Glossary: Weight & Model

- 🧩 Token — a chunk of text. A word.
- 🧭 Vector — a direction and a distance. Similar words (or ideas) point the same way.
- 🎛️ Weight — a dial. How strongly two tokens are connected.
- 🧠 Model — all the dial positions together. The complete knowledge.

## Slide 10 — What Is a Model

Remember those tokens we spoke about earlier.

Those tokens...

Prompt: the question we ask or what we want to do.

TODO: Put in the "What is a model" content.

## Slide 11 — Everything Is Linked — Don't Train It on Only One Topic

- TODO: "why not just train it on our topic — don't give it science when we're doing arts?"
- TODO: researchers removed all the other fields from a model's training and the responses got worse — everything appears to be linked
- TODO: find and cite the paper (leads: domain-coverage ablations, Longpre et al. NAACL 2024; over-specialisation work)
- TODO: breadth of knowledge is what makes the focused answers good

## Slide 12 — But It Wasn't Trained on You

But then with an AI model, it has zero context of who we are. Its context is built from the world — it was trained on books, .......

The model has knowledge. Trillions of patterns. Books, articles, code, conversations, textbooks, recipes, forums, novels, manuals.

It's read more than any one person could read in ten lifetimes.

But here's the thing:

**It wasn't trained on you.**

But we bring context to the table whether we know it or not.

It doesn't know your name. It doesn't know what you do. It doesn't know that you're standing in a room right now trying to understand how this thing works.

It doesn't know that you grew up in Melbourne, or that you worked in finance, or that you play cricket on weekends, or that you're worried about your kid's homework, or that you've been told to "learn AI" and you're not sure where to start.

It knows everything about the world.

And nothing about you.

All of these things shape the way we see the world and shape what we do.

So everything we do and say is shaped by everything that has come before.

✍️ Prompt — what you type. Where you start.

## Slide 13 — The Glossary: Prompt

- 🧩 Token — a chunk of text. A word.
- 🧭 Vector — a direction and a distance. Similar words (or ideas) point the same way.
- 🎛️ Weight — a dial. How strongly two tokens are connected.
- 🧠 Model — all the dial positions together. The complete knowledge.
- ✍️ Prompt — what you type. Where you start.

## Slide 14 — The Prompt Knows Nothing

The prompt knows nothing if it has no context.

So when you type a question into an AI — "Write me an email" — it has no idea:

- Who you are
- Who the email is for
- What tone you want
- What you've already said to that person
- What your relationship is
- What you're actually trying to achieve

It's like walking up to a stranger who has read every book in the library and saying:

"Help me."

And expecting them to know what you need.

They can't.

Not because they're dumb. Because they don't know you.

So here's the question:

If the model has knowledge but no context of who you are — and you bring context to everything you do — then how do we get our context into the conversation?

Because that's the whole game now.

It's not about asking better questions.

It's about bringing more of yourself to the question.

## Slide 15 — You're Not a Prompt Builder, You're a Context Builder

We looked earlier at asking the exact same question and getting completely different answers.

Same question. Different context. Different result.

So we know that context is everything.

But here's the shift:

A prompt is a question. A context builder is someone who layers in who they are, what they need, and why it matters before they ask.

## Slide 16 — The Same Question, Three Answers

Let's ask the same question three ways:

**Version 1:**

"Write me an email."

The model has no idea what you need. It guesses. You get something generic. You delete it.

**Version 2:**

"Write me an email to my manager asking for a day off next Friday."

Better. But still missing things. Is this urgent? Is it a sick day? A family thing? Does your manager prefer short emails or detailed ones?

**Version 3:**

"I'm a project manager at a mid-size marketing agency. My manager, Sarah, prefers short emails and is currently stressed about a deadline. I need next Friday off for my daughter's school play — it's the only day she's performing and my partner can't make it. Write me a quick email asking for the day. Keep it under 5 sentences."

Same question. But now the model has context about who you are, who you're writing to, what matters, and what success looks like.

The email it writes is nothing like the first one. Because the context is different.

## Slide 17 — The Context Layers

Think of context like layers you add to a question:

**Who are you?**

- "I'm a small business owner." / "I'm a university student." / "I'm a teacher of Year 5 kids."

**Who is this for?**

- "My team." / "My client." / "My teenager."

**What's the situation?**

- "We're behind on a project." / "I need to explain something complicated simply." / "We're celebrating a win."

**What do you want?**

- "Keep it under 5 sentences." / "Give me three options." / "Start with the bottom line."

Each layer changes the output. Add more layers, get better results.

## Slide 18 — The Mental Shift

Most people think: "What do I need to type?"

The context builder thinks: "What does it need to know?"

It's a different question. And it changes everything.

You're not trying to write the perfect prompt. You're trying to give the model the same context you'd give a colleague sitting next to you.

Because that's exactly what you'd do. Stop thinking about AI as a computer. Think of it as how you would talk to another person.

You wouldn't walk up to your colleague and say "help me" and expect them to know what you need. You'd say:

"Hey, I've got this thing with Sarah next Friday. Can I get the day off? She's stressed about the campaign but I really need it."

That's context. That's what you're doing when you talk to AI.

## Slide 19 — The Analogy

You wouldn't send a chef into a kitchen with no order, no dietary requirements, no guest count, and expect a good meal.

You'd say:

"Six guests. Two vegetarians. One allergic to nuts. They're coming at 7. They like good wine but don't know much about it. Make it feel special but not formal."

That's an order. That's context.

Every prompt is an order to a chef who has never met you.

## Slide 20 — Context in the Real World

Here's how a broker actually builds context, from broad to specific. This is what you do now — you probably just haven't thought about it.

**The Context Framework**

Every good prompt starts with layers:

- **Who is the client?** — Industry, size, role, location
- **What are they trying to do?** — Renewal, claim, new business, change of circumstance
- **What do they currently have?** — Insurer, policy, limits, premium, claims history
- **What's happening in their world?** — Industry trends, regulatory changes, market conditions
- **What do I have to offer?** — Specialty advice, specialty product
- **What do they need from me?** — Quote, advice, explanation, comparison, something else
- **What do I actually want to do?** — Get rid of them? Quote them? Pass them to someone else?
- **What's the tone?** — Formal, casual, technical, plain English

Then you layer it all together.

## Slide 21 — Dumb and Dumber

When it is trying to be helpful, that is when it's at its most dangerous.

- Example screenshot: "I just made that up"
- Example screenshot: "Yes, you told me not to do that before and I did it anyway"
- Screenshot of OpenClaw wiping a CTO's entire system.

## Slide 22 — You Don't Have to Do One and Done

Say that I need to write an email, here is the idea I have, ask me a couple of questions and I will give answers. When I think you have the right idea, then I will tell you to write the draft.

## Slide 23 — Precision Is Key

Remember earlier — words have meaning.

Precision is key. Pick words or phrases that have meaning.

One output is another input.

## Slide 24 — Trust in Information

Where information comes from matters.

- **Tier 1.** Policy wordings, policy documents, legislation
- **Tier 2.** Broker, underwriter, lawyer
- **Tier 3.** Manager, other brokers
- **Tier 4.** Something someone told you on some random website or forum.

If you have information that you may or may not trust, verify it — it could pollute everything you do.

## Slide 25 — Your Context Is Reusable

Your context is reusable. Build your own context.

## Slide 26 — Transformers: Robots in Disguise

- OCR: Picture to words
- Voice to words
- Words to spreadsheet
- Spreadsheet to words


## Slide 27 — It's not about the Car, its about the Driver.

Slide about skills behind the wheel are more imporant.

## Slide 28 — Choose the Right Model for the Right Task

Different models, different outcomes.

Based on the data they were trained on, the examples they were given of what was right or wrong, good or better.

You need to work out what works for you based on what you are trying to achieve.

A car analogy: you don't take a Ferrari 4WD-ing, but you don't take the 4WD to the racetrack. Each has a purpose — not right or wrong.

## Appendix 1 — Email Examples with Context

### Health Industry (Massage Therapists, Psychologists, Physios)

**Layer 1 — Who:**

"Sarah is a clinical psychologist in Melbourne's east. Solo practitioner, 12 years in practice, sees 25 clients a week. Half her sessions are now telehealth."

**Layer 2 — What they have:**

"Currently with AIQ on a professional indemnity and public liability bundle. $10M limits. $2,400/year premium. Renewal due in 3 weeks. No claims in 12 years."

**Layer 3 — What's happening:**

"PI premiums for psychologists have jumped 30–50% across the board. AIQ has tightened underwriting post a few large claims in the mental health space. Several brokers report clients being non-renewed."

**Layer 4 — What they need:**

"Sarah is anxious about the renewal. She's heard horror stories from colleagues about premium jumps and being left exposed. She needs me to get competitive quotes, make sure there's no gap in coverage, and explain any changes in policy wording — especially around telehealth and record-keeping."

**Layer 5 — The prompt:**

"I need to write Sarah an email before her renewal. She's currently with AIQ on PI and PL, $10M limits, $2,400/year, no claims. Renewal in 3 weeks. PI premiums for psychologists are up 30–50% industry-wide and AIQ has tightened. She's anxious and needs reassurance. I'm getting quotes from two other specialists. Write me an email that: tells her I'm on it, explains why premiums are up (without scaring her), sets expectations that her renewal might increase, and tells her what I need from her to get the best quotes. Tone: calm, competent, reassuring. Plain English."

### Entertainment Industry

**Layer 1 — Who:**

"Jax runs a mobile DJ and lighting business in Sydney. One operator, 5 years in business. Provides equipment for weddings, corporate events, and private functions. Average 3–4 events per week."

**Layer 2 — What they have:**

"Currently with Hiscox. Public liability $20M, plant and equipment $50,000. $1,800/year premium. One small claim 3 years ago — damaged a client's speaker at a wedding, cost $2,200. Good claims history overall."

**Layer 3 — What's happening:**

"Equipment replacement costs have risen 25% since 2022. Several insurers have pulled back on entertainment coverage. Hiscox has increased renewal premiums across the board for mobile entertainers. There's also growing client contracts requiring $20M public liability — Jax's current policy has it but some new venues are asking for event cancellation cover too."

**Layer 4 — What they need:**

"Jax's renewal is coming up and he expects a price hike. He wants to stay with Hiscox if the increase is reasonable, but needs backup quotes. He also wants to know if event cancellation cover is worth adding. He's not technical — he just wants to know he's covered and what the fair price is."

**Layer 5 — The prompt:**

"I need to prepare for Jax's renewal conversation. He's with Hiscox on PL $20M + plant $50K, $1,800/year, one small claim 3 years ago. Equipment costs are up 25%. He needs $20M PL + event cancellation. Jax expects a price rise, wants to stay if it's fair, and needs to know if event cancellation is worth adding. Write me a summary I can use in our renewal meeting: where we are, what's driving the price up, what my options are, and what I should recommend. Tone: straightforward, no jargon, like I'm talking to him at the counter."

### Not-For-Profit

**Layer 1 — Who:**

"Sunrise Community Care is a small NFP in regional NSW. 15 volunteers, 2 part-time staff. Runs after-school programs for disadvantaged kids. Annual budget around $350,000. Incorporated association."

**Layer 2 — What they have:**

"Currently with QBE on a standard NFP package: PL $10M, property (their community hall), volunteer accident coverage. $4,200/year. One PL claim 5 years ago — volunteer tripped on a loose carpet, cost $3,500. No other claims."

**Layer 3 — What's happening:**

"NFP premiums have been volatile. QBE has repriced their NFP book in NSW. There's a general hardening in PL across the board — insurers are more cautious about community-facing organisations. Several NFPs in the region report being put on non-standard terms or declined. The Australian Charities and Not-for-profits Commission (ACNC) has also tightened governance expectations, which is affecting D&O demand."

**Layer 4 — What they need:**

"The organisation's coordinator, Linda, is not insurance-literate. She got a renewal notice from QBE with a 60% increase and standard terms including a $5,000 PL excess (up from $1,000). She's scared and called me panicking. I need to: get alternative quotes, explain what changed and why, and help her understand what she's looking at. She needs reassurance and plain English."

**Layer 5 — The prompt:**

"I need to call Linda at Sunrise Community Care tomorrow. They're with QBE on an NFP package — PL $10M, property, volunteer accident — $4,200/year, one old claim. QBE has renewed with a 60% increase and raised the PL excess from $1,000 to $5,000. NFP premiums are hardening in NSW, QBE is repricing..."

### Equine Insurance

**Layer 1 — Who:**

"Mark runs a 40-hectare horse stud in the Hunter Valley, NSW. Breeds and races thoroughbreds. 25 mares on station at any time, plus 15 yearlings and foals. Two full-time staff, plus casual yard hands during foaling season. Has a separate agri-insurer for the property but needs specialist equine cover."

**Layer 2 — What they have:**

"Currently with IAG (National Mutual) on a stud package: live animal cover on 25 mares at $150,000 each (mortality, major surgical, teeth, and infertility). Also covers stud fees — $75,000 per mare per season. Property is separately insured. Premium $48,000/year. No claims in the last 5 years."

**Layer 3 — What's happening:**

"Equine mortality claims are up — a couple of high-profile horse deaths in the Hunter Valley have triggered a wave of claims across the book. Insurers are repricing stud packages. IAG is asking for vet health certificates on every animal before renewing. Two other stud owners in the region have lost cover entirely. There's also a shortage of infertility cover — several underwriters have pulled out of this extension."

**Layer 4 — What they need:**

"Mark's renewal is in 4 weeks. He expects a price increase and wants to know if he'll still get infertility cover. He's not worried about the premium — he's worried about being unable to get equivalent cover elsewhere. He needs me to secure his position and lock in the terms before the market gets worse."

**Layer 5 — The prompt:**

"Mark's a Hunter Valley stud owner, 25 mares at $150K each + $75K stud fee cover, $48K/year with IAG, no claims. Equine claims are up, IAG is requiring vet certificates, infertility cover is shrinking. Mark's renewal in 4 weeks — he's not price-sensitive, he just needs to lock in equivalent cover before it disappears. Write me a market inquiry email to 3 specialist equine underwriters asking for renewal quotes with the same terms, flagging that infertility cover is critical. Tone: professional, direct, urgent but not desperate."
