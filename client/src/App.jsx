
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  translations,
  anatomyTopics,
  diseases,
  quizQuestions
} from "./data.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function App() {
  const [language, setLanguage] = useState("tr");
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const t = translations[language];
  const rtl = language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [language, rtl]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!supabase) {
        throw new Error("Supabase configuration is missing.");
      }

      if (authMode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setMessage("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setPage("home");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setPage("home");
  }

  const questions = quizQuestions.filter(
    q => q.level === level
  );

  const currentQuestion = questions[questionIndex];

  function startQuiz() {
    setQuestionIndex(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setPage("quiz");
  }

  function answerQuestion(index) {
    if (answered) return;

    setSelected(index);
    setAnswered(true);

    if (index === currentQuestion.answer) {
      setScore(value => value + 1);
    }
  }

  function nextQuestion() {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(value => value + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setPage("quiz-result");
    }
  }

  async function saveProgress() {
    if (!supabase || !session || !questions.length) return;

    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: session.user.id,
      level,
      score,
      total_questions: questions.length
    });

    if (error) {
      console.error("Progress save failed:", error.message);
    }
  }

  useEffect(() => {
    if (page === "quiz-result") saveProgress();
  }, [page]);

  function Header() {
    return (
      <header className="header">
        <div className="brand" onClick={() => setPage("home")}>
          <div className="brand-icon">D</div>
          <div>
            <strong>DİŞ LAB</strong>
            <small>Dental Learning Platform</small>
          </div>
        </div>

        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          aria-label="Language"
          className="language-select"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>

        <button
          className="profile-button"
          onClick={() => setPage(session ? "profile" : "auth")}
        >
          {session ? "My Account" : t.signIn}
        </button>
      </header>
    );
  }

  function Navigation() {
    const items = [
      ["home", t.home, "⌂"],
      ["anatomy", t.anatomy, "◉"],
      ["diseases", t.diseases, "✚"],
      ["quizzes", t.quizzes, "✓"]
    ];

    return (
      <nav className="navigation">
        {items.map(([id, label, icon]) => (
          <button
            key={id}
            className={page === id ? "nav-item active" : "nav-item"}
            onClick={() => setPage(id)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="app" dir={rtl ? "rtl" : "ltr"}>
      <Header />

      <main className="main">
        {page === "home" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="eyebrow">DENTAL EDUCATION PLATFORM</span>
                <h1>{t.welcome}</h1>
                <p>{t.tagline}</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("anatomy")}
                >
                  {t.anatomy} →
                </button>
              </div>
              <div className="hero-tooth">🦷</div>
            </section>

            <section className="section">
              <h2>Explore DİŞ LAB</h2>
              <div className="feature-grid">
                <Feature
                  icon="🦷"
                  title={t.anatomy}
                  description="Explore tooth structures and anatomy."
                  onClick={() => setPage("anatomy")}
                />
                <Feature
                  icon="🔬"
                  title={t.diseases}
                  description="Study oral and dental conditions."
                  onClick={() => setPage("diseases")}
                />
                <Feature
                  icon="📚"
                  title={t.quizzes}
                  description="Test your dental knowledge."
                  onClick={() => setPage("quizzes")}
                />
              </div>
            </section>

            <section className="notice">
              {t.educationalNotice}
            </section>
          </>
        )}

        {page === "anatomy" && (
          <section className="section">
            <h1>{t.anatomy}</h1>
            <p>Explore the fundamental structures of human teeth.</p>

            <div className="topic-grid">
              {anatomyTopics.map(topic => (
                <article className="topic-card" key={topic.id}>
                  <div className="topic-icon">🦷</div>
                  <h3>{topic.title[language]}</h3>
                  <p>{topic.description[language]}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "diseases" && (
          <section className="section">
            <h1>{t.diseases}</h1>
            <p>Explore our introductory disease learning library.</p>

            <div className="disease-list">
              {diseases.map(disease => (
                <article className="disease-card" key={disease.id}>
                  <div>
                    <h3>{disease.name[language]}</h3>
                    <p>{disease.description[language]}</p>
                  </div>
                  <span className="review-status">Under review</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "quizzes" && (
          <section className="section quiz-panel">
            <h1>{t.quizzes}</h1>
            <p>Choose your difficulty level.</p>

            <div className="level-grid">
              {["beginner", "intermediate", "advanced"].map(item => (
                <button
                  key={item}
                  onClick={() => setLevel(item)}
                  className={level === item ? "level active" : "level"}
                >
                  {t[item]}
                </button>
              ))}
            </div>

            <button className="primary-button" onClick={startQuiz}>
              {t.startQuiz}
            </button>
          </section>
        )}

        {page === "quiz" && currentQuestion && (
          <section className="section quiz-panel">
            <span className="eyebrow">
              {t[level]} · {questionIndex + 1}/{questions.length}
            </span>

            <h2>{currentQuestion.question[language]}</h2>

            <div className="answer-list">
              {currentQuestion.options[language].map((option, index) => (
                <button
                  key={index}
                  className={
                    answered && index === currentQuestion.answer
                      ? "answer correct"
                      : answered && index === selected
                        ? "answer incorrect"
                        : "answer"
                  }
                  onClick={() => answerQuestion(index)}
                  disabled={answered}
                >
                  {option}
                </button>
              ))}
            </div>

            {answered && (
              <div className="explanation">
                <strong>
                  {selected === currentQuestion.answer
                    ? "Correct!"
                    : "Not quite."}
                </strong>
                <p>{currentQuestion.explanation[language]}</p>
              </div>
            )}

            {answered && (
              <button className="primary-button" onClick={nextQuestion}>
                {questionIndex + 1 === questions.length
                  ? t.finish
                  : t.next}
              </button>
            )}
          </section>
        )}

        {page === "quiz-result" && (
          <section className="section quiz-panel">
            <h1>Quiz completed!</h1>
            <div className="result-score">
              {score} / {questions.length}
            </div>
            <p>Your result has been calculated.</p>
            {session && <p>Your result is being saved to your account.</p>}
            <button
              className="primary-button"
              onClick={() => setPage("quizzes")}
            >
              Back to quizzes
            </button>
          </section>
        )}

        {page === "auth" && (
          <section className="auth-card">
            <h1>{authMode === "login" ? t.signIn : t.signUp}</h1>

            <form onSubmit={handleAuth}>
              <label>{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <label>{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
              />

              <button className="primary-button" disabled={loading}>
                {loading ? "Please wait..." : authMode === "login" ? t.signIn : t.signUp}
              </button>
            </form>

            {message && <p className="message">{message}</p>}

            <button
              className="text-button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {authMode === "login"
                ? "Create a new account"
                : "Already have an account? Sign in"}
            </button>
          </section>
        )}

        {page === "profile" && (
          <section className="section quiz-panel">
            <h1>My Account</h1>
            <p>{session?.user?.email}</p>
            <button className="primary-button" onClick={signOut}>
              {t.signOut}
            </button>
          </section>
        )}
      </main>

      <Navigation />

      <footer className="footer">
        <strong>DİŞ LAB</strong>
        <p>Learn dentistry with confidence.</p>
        <small>Educational use only · Academic review required</small>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description, onClick }) {
  return (
    <button className="feature-card" onClick={onClick}>
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="feature-arrow">Explore →</span>
    </button>
  );
}
