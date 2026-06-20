<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="refresh" content="5">
    <title>Dashboard Pastillero</title>
</head>
<body>
    <h1>Estados del Pastillero</h1>
    <table border="1" cellpadding="8">
        <tr>
            <th>Dispositivo</th>
            <th>Estado</th>
            <th>Fecha</th>
        </tr>
        @foreach ($estados as $e)
        <tr>
            <td>{{ $e->dispositivo_id }}</td>
            <td>{{ $e->estado }}</td>
            <td>{{ $e->created_at->format('d/m/Y H:i:s') }}</td>
        </tr>
        @endforeach
    </table>
</body>
</html>