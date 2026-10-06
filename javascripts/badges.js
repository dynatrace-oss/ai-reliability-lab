(function () {
  // TODO: set to true before launch
  var WEBHOOK_ENABLED = true;

  // Each badge maps to one page. Add entries here as new sections get badge support.
  var BADGES = [
    { id: 'tokens',               name: 'Tokens',              emoji: '🪙', path: '/foundation/tokens', quiz: true },
    { id: 'anatomy-of-a-request', name: "What's in a Request", emoji: '📦', path: '/foundation/anatomy-of-a-request', quiz: true },
    { id: 'opentelemetry',        name: 'OpenTelemetry',        emoji: '📡', path: '/foundation/opentelemetry', quiz: true },
    { id: 'aws-bedrock',          name: 'AWS Bedrock',          emoji: '☁️', path: '/foundation/aws-bedrock', quiz: true },
    { id: 'dynatrace-setup',      name: 'Dynatrace Setup',      emoji: '⚙️', path: '/foundation/dynatrace-setup', quiz: true },
    { id: 'first-ai-call',        name: 'First AI Call',        emoji: '🤖', path: '/monitor-production/01-single-call', quiz: true },
    { id: 'observability',        name: 'Observability',        emoji: '📊', path: '/monitor-production/02-add-observability', quiz: true },
    { id: 'guardrails',           name: 'Guardrails',           emoji: '🛡️', path: '/monitor-production/03-guardrails', quiz: true },
    { id: 'agentic-pipeline',     name: 'Agentic Pipeline',     emoji: '🔗', path: '/monitor-production/04-agentic-pipeline', quiz: true },
    { id: 'agentic-loop',         name: 'Agentic Loop',         emoji: '🔄', path: '/monitor-production/05-agentic-loop', quiz: true },
    { id: 'streaming',            name: 'Streaming',            emoji: '⚡', path: '/monitor-production/06-streaming', quiz: true },
    { id: 'rag',                  name: 'RAG',                  emoji: '📚', path: '/monitor-production/07-rag', quiz: true },
    { id: 'model-selection',      name: 'Model Migration',      emoji: '🔀', path: '/monitor-production/08-model-selection', quiz: true },
  ];

  function getEarned() {
    try {
      return JSON.parse(localStorage.getItem('dt-badges') || '[]');
    } catch (e) {
      return [];
    }
  }

  function sectionOf(badgePath) {
    return badgePath.split('/').filter(Boolean)[0] || '';
  }

  function badgesForSection(section) {
    return BADGES.filter(function (b) { return sectionOf(b.path) === section; });
  }

  function badgeForCurrentPage() {
    var path = window.location.pathname;
    for (var i = 0; i < BADGES.length; i++) {
      if (path.indexOf(BADGES[i].path) !== -1) return BADGES[i];
    }
    return null;
  }

  function allSections() {
    var seen = {};
    var sections = [];
    BADGES.forEach(function (b) {
      var s = sectionOf(b.path);
      if (!seen[s]) { seen[s] = true; sections.push(s); }
    });
    return sections;
  }

  function sectionLabel(slug) {
    return slug.replace(/-/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  // Derive a root-relative URL to another top-level path, handling subdirectory deploys
  function siteUrl(topLevelPath) {
    return window.location.origin + topLevelPath;
  }

  function earnBadge(id) {
    var earned = getEarned();
    if (earned.indexOf(id) !== -1) return;
    earned.push(id);
    localStorage.setItem('dt-badges', JSON.stringify(earned));
    if (WEBHOOK_ENABLED) fetch('https://webhook.site/91837860-74cf-4851-bc5c-c502a79ea70d', {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ badge: BADGES.find(function(b) { return b.id === id; }).path.replace(/^\//, '') })
    }).catch(function() {});
    showToast(id);
    renderBadgeProgress();
    renderSidebarBadges();
  }

  function clearBadges() {
    localStorage.removeItem('dt-badges');
    renderBadgeProgress();
    renderSidebarBadges();
    renderBadgesPage();
  }

  function showToast(id) {
    var badge = BADGES.filter(function (b) { return b.id === id; })[0];
    if (!badge) return;

    var existing = document.querySelector('.dt-badge-toast');
    if (existing) existing.remove();

    var section = sectionOf(badge.path);
    var sectionUrl = window.location.pathname.replace(new RegExp('/' + section + '/.*'), '/' + section + '/');

    var toast = document.createElement('div');
    toast.className = 'dt-badge-toast';
    toast.innerHTML =
      '<span class="dt-badge-toast-emoji">' + badge.emoji + '</span>' +
      '<div class="dt-badge-toast-body">' +
        '<div>You earned the <strong>' + badge.name + '</strong> badge!</div>' +
        '<a href="' + sectionUrl + '" class="dt-badge-toast-link">View all your badges &#8594;</a>' +
      '</div>';
    document.body.appendChild(toast);

    setTimeout(function () { toast.classList.add('dt-badge-toast--visible'); }, 50);
    setTimeout(function () {
      toast.classList.remove('dt-badge-toast--visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, 5000);
  }

  // Sidebar strip — appended to the bottom of the primary (left) nav sidebar
  function injectSidebarBadges() {
    var inner = document.querySelector('.md-sidebar--primary .md-sidebar__inner');
    if (!inner || document.getElementById('sidebar-badge-progress')) return;

    var strip = document.createElement('div');
    strip.id = 'sidebar-badge-progress';
    strip.className = 'dt-sidebar-badges';
    inner.appendChild(strip);
  }

  function renderSidebarBadges() {
    var container = document.getElementById('sidebar-badge-progress');
    if (!container) return;

    var earned = getEarned();
    var sectionsHtml = '';

    allSections().forEach(function (section) {
      var set = badgesForSection(section);
      var earnedCount = set.filter(function (b) { return earned.indexOf(b.id) !== -1; }).length;

      sectionsHtml +=
        '<div class="dt-sidebar-badges-section">' +
          '<div class="dt-sidebar-badges-header">' +
            '<span>' + sectionLabel(section) + '</span>' +
            '<span class="dt-sidebar-badges-count">' + earnedCount + '&thinsp;/&thinsp;' + set.length + '</span>' +
          '</div>' +
          '<div class="dt-sidebar-badges-icons">' +
            set.map(function (b) {
              var done = earned.indexOf(b.id) !== -1;
              return '<span class="dt-sidebar-badge-icon' + (done ? ' dt-sidebar-badge-icon--earned' : '') +
                '" title="' + b.name + (done ? ' ✓' : '') + '">' + b.emoji + '</span>';
            }).join('') +
          '</div>' +
        '</div>';
    });

    container.innerHTML =
      '<div class="dt-sidebar-badges-title">' +
        '<span>Badges</span>' +
        '<a href="' + siteUrl('/badges/') + '" class="dt-sidebar-badges-view-all">View all &#8594;</a>' +
      '</div>' +
      sectionsHtml;
  }

  // Inline progress strip injected above the sentinel on individual badged pages
  function injectBadgeProgress() {
    var match = badgeForCurrentPage();
    if (!match) return;
    if (document.getElementById('badge-progress')) return;

    var sentinel = document.getElementById('badge-sentinel');
    if (!sentinel) return;

    var section = document.createElement('div');
    section.className = 'dt-badge-section';
    section.innerHTML =
      '<p class="dt-badge-section-title">Your badges</p>' +
      '<div id="badge-progress" class="dt-badge-progress"></div>';
    sentinel.parentNode.insertBefore(section, sentinel);
  }

  // --- Quiz ---

  var QUIZZES = {
    'opentelemetry': [
      {
        text: 'What is the relationship between a trace and a span?',
        options: [
          'A span is the complete story of an operation; a trace is one step within it',
          'A trace is the complete story of an operation; a span is one step within it',
          'They are the same thing with different names depending on the provider',
          'A span contains multiple traces'
        ],
        answer: 1
      },
      {
        text: 'What is the main reason to route telemetry through an OpenTelemetry Collector rather than sending it directly to a backend?',
        options: [
          'It makes data transfer faster by compressing payloads',
          'It encrypts telemetry data automatically',
          'It decouples your application from your observability infrastructure',
          'It is required by the OpenTelemetry specification'
        ],
        answer: 2
      },
      {
        text: 'What are the GenAI semantic conventions?',
        options: [
          'A set of AI models that OpenTelemetry officially supports',
          'Standard attribute names for AI-related telemetry, such as gen_ai.usage.input_tokens',
          'A protocol for sending data between AI providers',
          'Pre-built dashboards for visualising AI calls in Dynatrace'
        ],
        answer: 1
      }
    ],
    'anatomy-of-a-request': [
      {
        text: 'A user types 4 words. According to the example on this page, what best describes how many tokens the model actually receives?',
        options: [
          'Roughly the same, about what the user typed',
          'A little more, maybe double the user\'s message',
          'Significantly more, because system prompt, history, and tool definitions are included',
          'Fewer, because providers compress messages before sending them'
        ],
        answer: 2
      },
      {
        text: 'Who writes the system prompt, and can the end user see it?',
        options: [
          'The end user writes it and the model can see it',
          'The application developer writes it; it is invisible to the end user',
          'The model generates it automatically on each request',
          'Both the developer and the user contribute to it'
        ],
        answer: 1
      },
      {
        text: 'Tool definitions add tokens to every request even when…',
        options: [
          'the user explicitly asks for tool use',
          'the system prompt is longer than 500 tokens',
          'none of the tools are actually called during that conversation turn',
          'the model is running in a multi-turn session'
        ],
        answer: 2
      }
    ],
    'dynatrace-setup': [
      {
        text: 'Which two API token scopes are required for the OTel Collector to send data to Dynatrace?',
        options: [
          'openTelemetryTrace.ingest and metrics.ingest',
          'traces.ingest and metrics.write',
          'dataExport and metricsRead',
          'openTelemetry.admin and metrics.admin'
        ],
        answer: 0
      },
      {
        text: 'How do credentials reach the collector without being written directly into the YAML config file?',
        options: [
          'They are base64-encoded inside the config file',
          'The collector fetches them from AWS Secrets Manager at startup',
          'They are passed as environment variables (DT_ENV_ID and DT_API_TOKEN) that the config references',
          'They are stored in a separate .env file that Docker reads automatically'
        ],
        answer: 2
      },
      {
        text: 'Port 4318 and port 4317 are both common OTel ports. Which protocol does each use?',
        options: [
          '4318 is gRPC; 4317 is HTTP',
          '4318 is HTTP; 4317 is gRPC',
          'Both ports support both protocols — you choose at connection time',
          'The port depends on which cloud provider you are using'
        ],
        answer: 1
      }
    ],
    'aws-bedrock': [
      {
        text: 'What is AWS Bedrock Mantle?',
        options: [
          'A monitoring service that tracks AI model performance in AWS',
          'A compatibility layer that exposes an OpenAI-compatible API on top of Bedrock',
          'An AWS CLI tool for deploying and managing Bedrock models',
          'A load balancer that routes requests across multiple AI providers'
        ],
        answer: 1
      },
      {
        text: 'What does the provide_token() function return, and why is it used as the API key?',
        options: [
          'A permanent API key retrieved from AWS Secrets Manager',
          'An OpenAI API key fetched directly from your OpenAI account',
          'A short-lived token derived from your AWS credentials, because Mantle uses AWS authentication rather than an OpenAI key',
          'A base64-encoded version of your AWS access key ID and secret'
        ],
        answer: 2
      },
      {
        text: 'Which Python library do the tutorials use to make calls to Bedrock Mantle, and why?',
        options: [
          'boto3, because it is the official AWS SDK and required for all Bedrock calls',
          'A custom aws_bedrock library that wraps the Bedrock REST API',
          'The anthropic library, because the underlying models are made by Anthropic',
          'The standard openai library, because Mantle exposes an OpenAI-compatible API'
        ],
        answer: 3
      }
    ],
    'observability': [
      {
        text: 'What happens if you omit provider.shutdown() at the end of a short-lived process?',
        options: [
          'The TracerProvider raises an exception on exit',
          'The OTel Collector rejects any data sent after the process starts shutting down',
          'Buffered spans that have not yet been exported are lost when the process exits',
          'Metrics continue to export but traces are dropped'
        ],
        answer: 2
      },
      {
        text: 'Why is a histogram a better choice than a counter for tracking token usage?',
        options: [
          'Histograms are cheaper to store and have lower cardinality than counters',
          'Histograms track the distribution of values including percentiles, so you can spot outlier requests using far more tokens than average',
          'Counters do not support custom attributes like gen_ai.token.type',
          'Histograms automatically reset at the end of each day'
        ],
        answer: 1
      },
      {
        text: 'Why are input and output tokens recorded as two separate calls to token_usage.record()?',
        options: [
          'The OTel specification requires separate records for different token types',
          'A single record call can only hold one numeric value',
          'So they can be filtered and charted independently in Dynatrace',
          'To avoid exceeding the per-request attribute limit on the histogram'
        ],
        answer: 2
      }
    ],
    'rag': [
      {
        text: 'What problem does RAG solve that sending the whole policy document on every request cannot?',
        options: [
          'It reduces the number of LLM calls needed per complaint from three to one',
          'It allows multiple policy documents to be processed in parallel',
          'It scales to large knowledge bases — a 500-page policy still sends only a few relevant chunks, whereas a full-document approach breaks when the policy grows too large to fit in a prompt',
          'It eliminates the need to index documents before the app can run'
        ],
        answer: 2
      },
      {
        text: 'retrieval.matched_sections is recorded on both the retrieval child span and the root span. Why the duplication on the root span?',
        options: [
          'The retrieval span is too short-lived to guarantee the attribute is exported',
          'So you can filter complaints by which policy sections were triggered at the trace level, without drilling into child spans every time',
          'Root span attributes are required by the OTel GenAI semantic conventions for retrieval operations',
          'The child span only stores the section vectors; the root span stores the human-readable names'
        ],
        answer: 1
      },
      {
        text: 'What does a consistently high value for rag.retrieval.chunk_count suggest?',
        options: [
          'The retrieval is working well and returning thorough, comprehensive results',
          'The vector store is running slowly and needs performance optimisation',
          'The query is too broad, or the policy chunks are not semantically distinct enough from each other',
          'The model is requesting more context than its context window can hold'
        ],
        answer: 2
      }
    ],
    'agentic-pipeline': [
      {
        text: 'What is an "agent" as defined on this page?',
        options: [
          'An autonomous AI system that monitors and reacts to external events',
          'A microservice that coordinates calls between multiple models',
          'An AI model given a specific job through a system prompt',
          'A Python class that wraps an LLM API call with retry logic'
        ],
        answer: 2
      },
      {
        text: 'The invoke_agent span is slow but the chat span inside it is fast. What does this tell you?',
        options: [
          'The model is producing too many output tokens',
          'The bottleneck is outside the model — for example, loading the system prompt from disk',
          'The OTel Collector is introducing export latency',
          'The model is being rate-limited by the provider'
        ],
        answer: 1
      },
      {
        text: 'What does a triage.outcome value of "escalated" mean in this trace?',
        options: [
          'All three agents ran and the policy check failed',
          'The urgency score was 4 or above; the complaint was handed to a human and no further agents ran',
          'The draft response was sent to the customer and marked for quality review',
          'The sentiment agent detected critical language and paused the pipeline'
        ],
        answer: 1
      }
    ],
    'agentic-loop': [
      {
        text: 'What is the orchestrator\'s role in an agentic loop?',
        options: [
          'To run each sub-agent in sequence and aggregate their results',
          'To decide which tools to call and in what order, without doing any of the actual work itself',
          'To validate sub-agent outputs before passing them to the next step',
          'To manage and truncate the conversation history between turns'
        ],
        answer: 1
      },
      {
        text: 'What is the orchestrator\'s only memory of what has happened in previous turns?',
        options: [
          'A structured state object maintained separately by the application',
          'A summary the orchestrator generates at the end of each turn',
          'The messages array, which every turn appends the orchestrator\'s requests and tool results to',
          'A key-value store updated by the dispatch function after each tool call'
        ],
        answer: 2
      },
      {
        text: 'Why is observability described as "essential" for an agentic loop rather than just "helpful"?',
        options: [
          'Agentic loops always use significantly more tokens, making cost monitoring critical',
          'In a pipeline the trace structure is fixed; in a loop it varies based on what the model decided to do, so you cannot know what happened without looking',
          'The OTel SDK requires extra configuration for loops, making instrumentation errors more likely',
          'Sub-agents run concurrently, making span nesting difficult to interpret'
        ],
        answer: 1
      }
    ],
    'streaming': [
      {
        text: 'Why must the span stay open for the full stream in streaming mode?',
        options: [
          'The OTel SDK cannot start a span until all response data is available',
          'Token counts and finish reason are not available until all chunks have been consumed',
          'The provider closes the connection if the span ends before streaming is complete',
          'Streaming spans require a minimum duration to appear in Dynatrace'
        ],
        answer: 1
      },
      {
        text: 'What does time-to-first-chunk measure, and why does it matter?',
        options: [
          'The total time to receive the complete response; it determines overall request latency',
          'The time from request to the first content chunk; a long wait feels broken to users even if the full response finishes quickly after',
          'The time the model spends generating tokens; it reflects model-side compute efficiency',
          'The time between successive chunks; it indicates whether there is network instability'
        ],
        answer: 1
      },
      {
        text: 'How do you get token counts when using streaming mode?',
        options: [
          'Token counts are unavailable in streaming mode and must be estimated from chunk count',
          'The SDK automatically injects token counts into the first chunk',
          'By setting stream_options={"include_usage": True}, which causes the provider to send a final chunk with chunk.usage populated',
          'By counting the number of chunks received and multiplying by an average token-per-chunk ratio'
        ],
        answer: 2
      }
    ],
    'guardrails': [
      {
        text: 'What does Bedrock set finish_reason to when a guardrail blocks a request?',
        options: [
          '"stop", the same value used for a normally completed response',
          '"blocked", indicating the safety layer rejected the request',
          '"guardrail_intervened", a Bedrock-specific value that signals the guardrail acted',
          '"error", indicating a server-side failure'
        ],
        answer: 2
      },
      {
        text: 'Why is a counter a better metric than a gauge for tracking blocked guardrail requests?',
        options: [
          'Counters are cheaper to store in Dynatrace than gauges',
          'A counter accumulates over time so you can chart intervention rate trends and set rate-based alerts; a gauge would only show the last value per scrape',
          'The OTel SDK does not support gauges for per-request events',
          'Counters automatically reset at midnight, making daily comparisons easier'
        ],
        answer: 1
      },
      {
        text: 'A sudden spike in gen_ai.guardrail.blocked_requests could indicate two very different problems. What are they?',
        options: [
          'A model version change, or a networking timeout between the app and Bedrock',
          'Users submitting invalid JSON, or the model generating malformed responses',
          'A coordinated prompt injection attempt, or a recently misconfigured guardrail that is now blocking legitimate traffic',
          'The OTel Collector losing its connection to Dynatrace, or a clock skew between services'
        ],
        answer: 2
      }
    ],
    'model-selection': [
      {
        text: 'What advantage does a feature flag give you over simply changing the model name in code when running a model migration?',
        options: [
          'Feature flags are faster to evaluate than reading from a config file',
          'You can adjust the traffic split at runtime without redeploying the application',
          'Feature flags automatically A/B test all available models simultaneously',
          'The OpenFeature SDK handles OTel instrumentation automatically'
        ],
        answer: 1
      },
      {
        text: 'Why does the app pass the complaint ID as the targeting key when evaluating the flag?',
        options: [
          'flagd requires a targeting key to connect to the gRPC server',
          'It prevents the same complaint from being processed twice',
          'The fractional operator hashes the targeting key, so the same complaint always routes to the same model variant across runs',
          'It allows flagd to log which complaints triggered each variant'
        ],
        answer: 2
      },
      {
        text: 'What should you check before drawing conclusions from latency or token cost comparisons between control and challenger?',
        options: [
          'That the flagd process has been running for at least 60 seconds',
          'That both models were called with identical system prompts',
          'That gen_ai.model_selection.requests confirms the actual traffic split matches the configured percentages',
          'That gen_ai.response.finish_reasons is the same across both variants'
        ],
        answer: 2
      }
    ],
    'first-ai-call': [
      {
        text: 'What does the messages array in a chat completion request represent?',
        options: [
          'A list of models available to call',
          'The conversation — it starts with one message but can grow to include the full history',
          'The system configuration and parameters for the model',
          'The output choices returned by the model'
        ],
        answer: 1
      },
      {
        text: 'What is the role value on the message inside each response choice?',
        options: [
          'Always "user", because the message is echoing back the user\'s input',
          'Always "system", because it comes from the model\'s system context',
          'Always "assistant", because it is the model\'s response',
          'It varies depending on which model you call'
        ],
        answer: 2
      },
      {
        text: 'The code works and prints a response. According to the page, what can you still not answer in production without observability?',
        options: [
          'What the model responded with — you have to add logging to see the output text',
          'Which endpoint the request was sent to — it is resolved at runtime',
          'How long the request took and how many tokens it used',
          'Whether the OpenAI client was configured correctly — it only fails silently'
        ],
        answer: 2
      }
    ],
    'tokens': [
      {
        text: 'Roughly how many characters make up one token in English text?',
        options: ['1 character', '4 characters', '10 characters', '75 characters'],
        answer: 1
      },
      {
        text: 'Output tokens typically cost how much more than input tokens?',
        options: ['The same amount', 'About 2x more', '3–5x more', 'About 10x more'],
        answer: 2
      },
      {
        text: 'In a multi-turn conversation, what happens to the input token count with each new message?',
        options: [
          'It stays the same each turn',
          'It resets; only the latest message is sent',
          'It grows because the entire history is sent with every request',
          'It shrinks as older messages expire'
        ],
        answer: 2
      }
    ]
  };

  function getAttempts(badgeId) {
    try { return parseInt(localStorage.getItem('dt-quiz-' + badgeId + '-attempts') || '0', 10); }
    catch (e) { return 0; }
  }

  function incrementAttempts(badgeId) {
    try {
      var n = getAttempts(badgeId) + 1;
      localStorage.setItem('dt-quiz-' + badgeId + '-attempts', String(n));
      return n;
    } catch (e) { return 1; }
  }

  function injectQuiz() {
    var badge = badgeForCurrentPage();
    if (!badge || !badge.quiz) return;
    if (document.getElementById('dt-quiz')) return;

    var questions = QUIZZES[badge.id];
    if (!questions) return;

    var sentinel = document.getElementById('dt-quiz-anchor') || document.getElementById('badge-sentinel');
    if (!sentinel) return;

    var questionsHtml = questions.map(function (q, qi) {
      return '<div class="dt-quiz-question" data-qi="' + qi + '">' +
        '<p class="dt-quiz-question-text"><strong>' + (qi + 1) + '.</strong> ' + q.text + '</p>' +
        '<div class="dt-quiz-options">' +
          q.options.map(function (opt, oi) {
            var id = 'dt-q' + qi + 'o' + oi;
            return '<label class="dt-quiz-option" for="' + id + '">' +
              '<input type="radio" id="' + id + '" name="q' + qi + '" value="' + oi + '"> ' +
              '<span>' + opt + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.id = 'dt-quiz';
    wrap.className = 'dt-quiz';
    wrap.innerHTML =
      '<h3 class="dt-quiz-title">Test your knowledge</h3>' +
      '<form id="dt-quiz-form" novalidate>' +
        questionsHtml +
        '<div class="dt-quiz-footer">' +
          '<button type="button" id="dt-quiz-submit" class="dt-quiz-submit">Check answers</button>' +
        '</div>' +
      '</form>' +
      '<div id="dt-quiz-result"></div>';

    sentinel.parentNode.insertBefore(wrap, sentinel);

    document.getElementById('dt-quiz-submit').addEventListener('click', function () {
      handleQuizSubmit(badge, questions);
    });
  }

  function handleQuizSubmit(badge, questions) {
    var form = document.getElementById('dt-quiz-form');
    var resultEl = document.getElementById('dt-quiz-result');

    var allAnswered = questions.every(function (q, qi) {
      return form.querySelector('input[name="q' + qi + '"]:checked');
    });
    if (!allAnswered) {
      resultEl.innerHTML = '<p class="dt-quiz-warning">Please answer all questions before submitting.</p>';
      return;
    }

    // Clear any highlights from a previous attempt
    form.querySelectorAll('.dt-quiz-option').forEach(function (label) {
      label.classList.remove('dt-quiz-option--correct', 'dt-quiz-option--wrong');
    });

    var score = 0;
    questions.forEach(function (q, qi) {
      var selected = parseInt(form.querySelector('input[name="q' + qi + '"]:checked').value, 10);
      var labels = form.querySelectorAll('.dt-quiz-question')[qi].querySelectorAll('.dt-quiz-option');
      if (selected === q.answer) {
        score++;
        labels[selected].classList.add('dt-quiz-option--correct');
      } else {
        labels[selected].classList.add('dt-quiz-option--wrong');
        labels[q.answer].classList.add('dt-quiz-option--correct');
      }
    });

    var total = questions.length;
    var perfect = score === total;
    var attempt = incrementAttempts(badge.id);

    if (window.dynatrace && typeof window.dynatrace.sendBizEvent === 'function') {
      window.dynatrace.sendBizEvent('docs.quiz.submitted', {
        'page_name': badge.id,
        'score': score,
        'total': total,
        'attempt': attempt,
        'perfect': perfect
      });
    }

    if (perfect) {
      resultEl.innerHTML =
        '<div class="dt-quiz-result--perfect">' +
          '<span class="dt-quiz-result-score">' + score + ' / ' + total + '</span>' +
          '<p>Perfect score! You\'ve earned the ' + badge.emoji + ' ' + badge.name + ' badge.</p>' +
        '</div>';
      earnBadge(badge.id);
    } else {
      resultEl.innerHTML =
        '<div class="dt-quiz-result--partial">' +
          '<span class="dt-quiz-result-score">' + score + ' / ' + total + '</span>' +
          '<p>' + (total - score) + ' incorrect. Correct answers are highlighted. Change your answers and try again.</p>' +
        '</div>';
    }
  }

  function initBadgeSentinel() {
    var match = badgeForCurrentPage();
    if (!match) return;
    if (match.quiz) return;

    var earned = getEarned();
    if (earned.indexOf(match.id) !== -1) return;

    var sentinel = document.getElementById('badge-sentinel');
    if (!sentinel) return;

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        earnBadge(match.id);
        observer.disconnect();
      }
    }, { threshold: 1.0 });
    observer.observe(sentinel);
  }

  function renderBadgeProgress() {
    var container = document.getElementById('badge-progress');
    if (!container) return;

    var path = window.location.pathname;
    var currentBadge = badgeForCurrentPage();
    var section = currentBadge ? sectionOf(currentBadge.path) : null;

    if (!section) {
      var parts = path.split('/').filter(Boolean);
      if (parts.length > 0) section = parts[0];
    }

    var set = section ? badgesForSection(section) : BADGES;
    var earned = getEarned();

    container.innerHTML = set.map(function (b) {
      var done = earned.indexOf(b.id) !== -1;
      return '<div class="dt-foundation-badge' + (done ? ' dt-foundation-badge--earned' : '') + '">' +
        '<span class="dt-foundation-badge-emoji">' + b.emoji + '</span>' +
        '<span class="dt-foundation-badge-name">' + b.name + '</span>' +
        (done ? '<span class="dt-foundation-badge-check">&#10003;</span>' : '') +
        '</div>';
    }).join('');
  }

  // Full badges page — rendered into #badges-page if it exists
  function renderBadgesPage() {
    var container = document.getElementById('badges-page');
    if (!container) return;

    var earned = getEarned();
    var html = '';

    allSections().forEach(function (section) {
      var set = badgesForSection(section);
      var earnedCount = set.filter(function (b) { return earned.indexOf(b.id) !== -1; }).length;

      html +=
        '<h2 class="dt-badges-page-section-heading">' + sectionLabel(section) +
          ' <span class="dt-badges-page-section-count">' + earnedCount + ' / ' + set.length + '</span>' +
        '</h2>' +
        '<div class="dt-badges-page-grid">' +
          set.map(function (b) {
            var done = earned.indexOf(b.id) !== -1;
            return '<div class="dt-badges-page-card' + (done ? ' dt-badges-page-card--earned' : '') + '">' +
              '<span class="dt-badges-page-emoji">' + b.emoji + '</span>' +
              '<span class="dt-badges-page-name">' + b.name + '</span>' +
              (done
                ? '<span class="dt-badges-page-status dt-badges-page-status--earned">Earned &#10003;</span>'
                : '<span class="dt-badges-page-status">Not yet earned</span>') +
            '</div>';
          }).join('') +
        '</div>';
    });

    container.innerHTML = html;

    var clearBtn = document.getElementById('badges-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.confirm('Clear all badges? This cannot be undone.')) {
          clearBadges();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectSidebarBadges();
    injectQuiz();
    injectBadgeProgress();
    initBadgeSentinel();
    renderSidebarBadges();
    renderBadgeProgress();
    renderBadgesPage();
  });
})();
