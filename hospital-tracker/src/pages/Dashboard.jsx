export default function Dashboard() {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-blue-700 mb-4">Bienvenido, Superadmin</h1>
          <p className="text-gray-700">Aquí podrás gestionar hospitales, crear geocercas, y administrar el personal.</p>
        </div>
        <div className="mt-8">
          <a
            href="/municipal-dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"
          >
            Ir al Dashboard Municipal (demo)
          </a>
        </div>
      </div>
    );
  }
